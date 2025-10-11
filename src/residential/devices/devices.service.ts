import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Device } from '../a.entities/dev_device.entity';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import { MessageDto } from '../../globals/message.dto';
import { TableFiltersDto } from '../../globals/tableFilters.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CondoviveService } from './condovive.service';
import { AdbService } from './adb.service';
import { ResponseGeneric } from '../../globals/reponse.class';


@Injectable()
export class DevicesService {
  private readonly logger = new Logger('DevicesService');
  private activeDevices: { [serial: string]: CondoviveService } = {};
  constructor(
    private ds: DataSource,
    @InjectRepository(Device)
    private devRepo: Repository<Device>,

  ) { }

  create(createClientDto: CreateDeviceDto) {
    return 'This action adds a new client';
  }

  //#region controller logic
  async findAll() {
    const repoHouse = this.ds.getRepository<Device>(Device)
    // const houses = await repoHouse.find();

    try {
      const queryBuilder = repoHouse.createQueryBuilder('d').innerJoin('d.sequences', 's')

      let houses = await queryBuilder.getMany();
      if (!houses) throw new NotFoundException(new MessageDto('lista vacía'))
      return houses
    } catch (error) {
      console.log(error)
      throw new NotFoundException(new MessageDto(error.message))
    }
  }

  async listPaginated(filters: TableFiltersDto) {

    try {
      let tagActivefilter = filters.showInactives == true ? 0 : 1;

      const SKIP = filters.limit * (filters.page - 1);

      const qb = this.devRepo.createQueryBuilder('q')
        .leftJoinAndSelect('q.sequences', 's')
        .leftJoinAndSelect('s.steps', 'st')
        //.select('q.deviceId')
        .skip(SKIP)
        .take(filters.limit)
        .where(
          [{
            //loadingDate: Between(filters.start, filters.end), //and
            tagActive: MoreThanOrEqual(tagActivefilter),//and
            //comments: Like(`%${filters.searchtxt}%`) ,//and
          },//or
          {
            //loadingDate: Between(filters.start, filters.end),
            tagActive: MoreThanOrEqual(tagActivefilter),
            //clientName: Like(`%${filters.searchtxt}%`),

          },
          ],
        )




      const total = await qb.getCount();
      const list = await qb.getMany();


      return { success: true, data: { items: list, totalItems: total } };
    } catch (error) {
      return { success: false, message: error.message, error: error }
    }


  }

  async save(device: CreateDeviceDto) {
    let saved = await this.devRepo.save(device)
  }

  async remove(id) {
    let data = await this.devRepo.findBy({ deviceId: In([+id]) })
    await this.devRepo.delete(+id)
  }




  async runCondovive(adbSerial: string): Promise<ResponseGeneric> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    await condoviveService.initApp()
    const resp = new ResponseGeneric();
    resp.success = true;
    resp.message = 'Condovive iniciado';
    return resp;
  }

  async stopCondovive(): Promise<ResponseGeneric> {
    //await this.condoviveService.stop();
    const resp = new ResponseGeneric();
    resp.success = true;
    resp.message = 'Condovive detenido';
    return resp;
  }

  async idleCondovive(): Promise<ResponseGeneric> {
    //await this.condoviveService.idle();
    const resp = new ResponseGeneric();
    resp.success = true;
    resp.message = 'Condovive en idle';
    return resp;
  }

  public async forceStopApp(adbSerial: string): Promise<void> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    return condoviveService.forceStopApp();
  }

  public async forceStopAllApps(adbSerial: string): Promise<void> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    return condoviveService.forceStopAllApps();
  }

  public async closeAllApps(adbSerial: string): Promise<void> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    return condoviveService.closeAllApps();
  }

  public async getDeviceScreenshot(adbSerial: string): Promise<string> {
    const condoviveService = this.activeDevices[adbSerial];
    if (!condoviveService) {
      throw new NotFoundException(`No se encontró un servicio activo para el dispositivo: ${adbSerial}`);
    }
    // Llama al método del servicio de negocio, que a su vez usa el servicio ADB
    return condoviveService.getDeviceScreenshot();
  }
  //#endregion


  //#region Adb Logic and Buisness Logic
  public async initializeServices() {
    this.logger.log('Cargando dispositivos de la base de datos...');
    // 🚨 MODIFICACIÓN CLAVE: Cargar las relaciones `sequences` y `steps`
    const devices = await this.devRepo.find({
      where: { tagActive: 1, tagDelete: 0 },
      relations: ['sequences', 'sequences.steps'] // Asegúrate de que los nombres coincidan con tus relaciones de entidad
    });

    if (devices.length === 0) {
      this.logger.warn('No se encontraron dispositivos en la base de datos.');
      return;
    }

    // Por cada dispositivo, creamos una instancia de AdbService y CondoviveService
    for (const device of devices) {
      this.logger.log(`Inicializando servicio para el dispositivo: ${device.adbDevice},. ${device.deviceName}`);
      const adbService = new AdbService(device); // Instancia del servicio ADB
      // 🚨 MODIFICACIÓN CLAVE: Pasamos el objeto Device completo al CondoviveService
      const condoviveService = new CondoviveService(adbService, device); // Servicio de la lógica de negocio
      this.activeDevices[device.adbDevice] = condoviveService;
    }

    this.logger.log(`Servicios de ${devices.length} dispositivos inicializados.`);
  }

  public getService(serial: string): CondoviveService | undefined {
    return this.activeDevices[serial];
  }

  public getAllServices(): CondoviveService[] {
    return Object.values(this.activeDevices);
  }

  // devices.service.ts (fragmento)
// Asegúrate de importar las entidades y decoradores necesarios.

// ...

public async reloadDeviceService(deviceId: number): Promise<void> {
    this.logger.log(`Recargando servicio para deviceId: ${deviceId}...`);

    // 1. Buscar el dispositivo actualizado en la DB con todas las relaciones
    const device = await this.devRepo.findOne({
        where: { deviceId, tagActive: 1, tagDelete: 0 },
        relations: ['sequences', 'sequences.steps'] 
    });

    if (!device) {
        this.logger.error(`Dispositivo ${deviceId} no encontrado o inactivo.`);
        throw new NotFoundException(`Dispositivo con ID ${deviceId} no encontrado o inactivo.`);
    }
    
    // 2. Obtener el serial del dispositivo
    const adbSerial = device.adbDevice;

    // 3. Detener el servicio activo actual (para asegurar un reinicio limpio)
    const oldService = this.activeDevices[adbSerial];
    if (oldService) {
        this.logger.log(`Deteniendo bucle de automatización anterior para ${adbSerial}.`);
         oldService.stop(); // Establece running = false y sale del bucle 'while'
         oldService.stopListening();
        // Opcional: espera un breve momento o implementa una espera más sofisticada 
        // para asegurarte que el bucle se detuvo.
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    // 4. Crear nuevas instancias de los servicios (AdbService y CondoviveService)
    this.logger.log(`Creando nuevas instancias de AdbService y CondoviveService para ${adbSerial}.`);
    const newAdbService = new AdbService(device);
    const newCondoviveService = new CondoviveService(newAdbService, device);

    // 5. Reemplazar la instancia antigua por la nueva
    this.activeDevices[adbSerial] = newCondoviveService;
    this.logger.log(`Servicio para ${adbSerial} actualizado en activeDevices.`);

    // 6. Reiniciar el bucle de automatización con la nueva configuración (asíncronamente)
    this.logger.log(`Iniciando nuevo bucle de automatización para ${adbSerial}.`);
    newCondoviveService.runAutomationLoop().catch(error => {
        this.logger.error(`Error en el bucle de automatización de ${adbSerial}: ${error.message}`);
    });

    this.logger.log(`✅ Dispositivo ${deviceId} recargado y reiniciado exitosamente.`);
}

// ...
  //#endregion
}
