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
      const queryBuilder = repoHouse.createQueryBuilder('d').innerJoin('d.sequences','s')

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
    const devices = await this.devRepo.find({ where: { tagActive: 1, tagDelete: 0 }, });

    if (devices.length === 0) {
      this.logger.warn('No se encontraron dispositivos en la base de datos.');
      return;
    }

    // Por cada dispositivo, creamos una instancia de AdbService y CondoviveService
    for (const device of devices) {
      this.logger.log(`Inicializando servicio para el dispositivo: ${device.adbDevice},. ${device.deviceName}`);
      const adbService = new AdbService(device); // Instancia del servicio ADB
      const condoviveService = new CondoviveService(adbService); // Servicio de la lógica de negocio
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
  //#endregion
}
