// src/residential/devices/application/devices.service.ts
import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Device } from '../../a.entities/dev_device.entity';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { TableFiltersDto } from '../../../globals/tableFilters.dto';
import { SequenceExecutorService } from '../automation/sequence-executore.service';
import { CondoviveService } from '../automation/condovive.service';
import { GpioService } from './gpio.service';
import { spawnSync } from 'child_process';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);
  private activeDevices: { [serial: string]: any } = {}; // map serial -> CondoviveService (instancia)

  constructor(
    @InjectRepository(Device)
    private readonly devRepo: Repository<Device>,
    private readonly seqExecutor: SequenceExecutorService,
    private readonly gpio: GpioService
  ) { }

  // onApplicationBootstrap() {
  //   // no inicializamos ciclos aquí: AutomationService lo hará (si lo prefieres, cambia).
  //   this.logger.log('DevicesService bootstrap ready.');
  // }

  async onModuleInit() {
    this.logger.log('Inicializando conexiones ADB a dispositivos WiFi...');

    const devices = await this.devRepo.find(); // o el método que uses para listar dispositivos

    for (const d of devices) {
      const serial = d.adbDevice;
      if (!serial) continue;

      // Verifica si es IP:PORT (formato de conexión WiFi)
      if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(serial)) {
        this.logger.log(`→ ADB connect ${serial}`);
        const result = spawnSync('adb', ['connect', serial], { encoding: 'utf8' });

        if (result.error) {
          this.logger.error(`❌ Error conectando ${serial}: ${result.error.message}`);
          continue;
        }

        if (result.stdout.includes('connected')) {
          this.logger.log(`✅ ${serial} conectado vía WiFi`);
        } else {
          this.logger.warn(`⚠️ ${serial}: ${result.stdout.trim()}`);
        }
      }
    }

    this.logger.log('Conexiones ADB inicializadas.');
  }

  async findAll(): Promise<Device[]> {
    return await this.devRepo.find({where:{tagEnabled :1}, relations: ['sequences', 'sequences.steps'] });
  }

  async listPaginated(filters: TableFiltersDto) {
    try {
      let tagActivefilter = filters.showInactives == true ? 0 : 1;
      const SKIP = filters.limit * (filters.page - 1);

      const qb = this.devRepo.createQueryBuilder('q')
        .leftJoinAndSelect('q.sequences', 's')
        .leftJoinAndSelect('s.steps', 'st')
        .skip(SKIP)
        .take(filters.limit)
        .where([{
          tagActive: MoreThanOrEqual(tagActivefilter),
        }, {
          tagActive: MoreThanOrEqual(tagActivefilter),
        }]);

      const total = await qb.getCount();
      const list = await qb.getMany();

      return { success: true, data: { items: list, totalItems: total } };
    } catch (error) {
      return { success: false, message: error.message, error: error };
    }
  }

  async save(device: CreateDeviceDto) {
    return await this.devRepo.save(device as any);
  }

  async remove(id: number) {
    const data = await this.devRepo.findBy({ deviceId: In([+id]) });
    await this.devRepo.delete(+id);
    return data;
  }

  public async getDeviceScreenshot(adbSerial: string): Promise<string> {
    const condoviveService: CondoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    // Llama al método del servicio de negocio, que a su vez usa el servicio ADB
    return condoviveService.getDeviceScreenshot();
  }

  public async closeAllApps(adbSerial: string): Promise<void> {
    const condoviveService: CondoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    return condoviveService.closeAllApps(this.seqExecutor);
  }

  public async restartServices(adbSerial: string): Promise<void> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    //return condoviveService.restartServices();
    await condoviveService.stopCycle();
    return condoviveService.startCycle(this.seqExecutor);
  }

  public async stopServices(adbSerial: string): Promise<void> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    return condoviveService.stopCycle();
  }

  public async startServices(adbSerial: string): Promise<void> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    return condoviveService.startCycle(this.seqExecutor);
  }

  public async writegpio(adbSerial: string): Promise<void> {
    const data = await this.devRepo.findOneBy({ adbDevice: In([adbSerial]) });
    data.gpioPin
    data.msPulse
    await this.gpio.pulse(data.gpioPin, data.msPulse);
    //return { ok: true, pin };
  }




  // Helpers para gestión de instances
  public registerService(serial: string, instance: any) {
    this.activeDevices[serial] = instance;
  }

  public unregisterService(serial: string) {
    delete this.activeDevices[serial];
  }

  // public getService(serial: string) {
  //   return this.activeDevices[serial];
  // }

  // public getAllServices() {
  //   return Object.values(this.activeDevices);
  // }
}
