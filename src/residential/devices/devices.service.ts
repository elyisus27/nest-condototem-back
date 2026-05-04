// src/residential/devices/devices.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';

import { Device } from '../a.entities/dev_device.entity';
import { DeviceThermalLog } from '../a.entities/dev_thermal_log.entity';
import { TableFiltersDto } from '../../globals/tableFilters.dto';
import { GpioService } from './application/gpio.service';
import { AutomationService } from './application/automation.service';
import { SequenceExecutorService } from './automation/sequence-executore.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateThermalDto } from './dto/create-thermal.dto';
import { CrossingLog } from '../a.entities/dev_crossing_log.entity';


@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private readonly devRepo: Repository<Device>,
    @InjectRepository(DeviceThermalLog)
    private readonly thermalRepo: Repository<DeviceThermalLog>,
    @InjectRepository(CrossingLog)
    private readonly crossingRepo: Repository<CrossingLog>,

    private readonly seqExecutor: SequenceExecutorService,
    private readonly gpio: GpioService,
    private readonly automationService: AutomationService,
  ) { }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async findAll(): Promise<Device[]> {
    return this.devRepo.find({
      where: { tagEnabled: 1 },
      relations: ['sequences', 'sequences.steps'],
    });
  }

  async listPaginated(filters: TableFiltersDto) {
    try {
      const tagActivefilter = filters.showInactives ? 0 : 1;
      const SKIP = filters.limit * (filters.page - 1);
      const qb = this.devRepo
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.sequences', 's')
        .leftJoinAndSelect('s.steps', 'st')
        .skip(SKIP)
        .take(filters.limit)
        .where({ tagActive: MoreThanOrEqual(tagActivefilter) });
      const [items, totalItems] = await Promise.all([qb.getMany(), qb.getCount()]);
      return { success: true, data: { items, totalItems } };
    } catch (error: any) {
      return { success: false, message: error.message, error };
    }
  }

  async save(device: CreateDeviceDto) {
    return this.devRepo.save(device as any);
  }

  async remove(id: number) {
    const data = await this.devRepo.findBy({ deviceId: In([+id]) });
    await this.devRepo.delete(+id);
    return data;
  }


  async CrossingLogListPaginated(filters: TableFiltersDto) {
    try {
      const tagActivefilter = filters.showInactives ? 0 : 1;
      const SKIP = filters.limit * (filters.page - 1);
      const searchtxt = filters.searchtxt?.trim();

      const qb = this.crossingRepo
        .createQueryBuilder('q')
        .select('q.id', 'id')
        .addSelect('q.state', 'state')
        .addSelect('q.host_name', 'hostName')
        .addSelect('q.host_unit', 'hostUnit')
        .addSelect('q.co_host', 'coHost')
        .addSelect('q.visitor_name', 'visitorName')
        .addSelect('q.visitor_phone', 'visitorPhone')
        .addSelect('q.visitor_email', 'visitorEmail')
        .addSelect('q.visit_type', 'visitType')
        .addSelect(
          "DATE_FORMAT(q.crossing_at, '%Y-%m-%d %H:%i:%s')",
          "crossingAt"
        )
        .where('q.crossing_at BETWEEN :start AND :end', {
          start: filters.start,
          end: filters.end,
        })
        .andWhere('q.tag_active >= :tagActive', {
          tagActive: tagActivefilter,
        });

      // Buscador: solo aplica cuando viene texto.
      if (searchtxt) {
        qb.andWhere(
          `(q.host_name LIKE :search 
          OR q.host_unit LIKE :search
          OR q.co_host LIKE :search
          OR q.visitor_name LIKE :search 
          OR q.visitor_phone LIKE :search
          OR q.visitor_email LIKE :search
          OR q.visit_type LIKE :search
          OR q.state LIKE :search)`,
          { search: `%${searchtxt}%` }
        );
      }

      const totalItems = await qb.getCount();
      const items = await qb
        .orderBy('q.crossing_at', 'DESC')
        .skip(SKIP)
        .take(filters.limit)
        .getRawMany();

      return { success: true, data: { items, totalItems } };
    } catch (error: any) {
      return { success: false, message: error.message, error };
    }
  }

  // ─── Control de ciclo (delega en AutomationService) ───────────────────────────

  async startServices(_adbSerial: string): Promise<void> {
    await this.automationService.startCycle();
  }

  async stopServices(_adbSerial: string): Promise<void> {
    this.automationService.stopCycle();
  }

  async restartServices(_adbSerial: string): Promise<void> {
    await this.automationService.restartCycle();
  }

  // ─── Screenshot ───────────────────────────────────────────────────────────────

  async getDeviceScreenshot(adbSerial: string): Promise<string> {
    const screenshot = await this.automationService.getScreenshot();
    if (!screenshot) {
      throw new NotFoundException(`No hay instancia activa para ${adbSerial}`);
    }
    return screenshot;
  }

  // ─── GPIO manual ──────────────────────────────────────────────────────────────

  async writegpio(adbSerial: string): Promise<void> {
    const data = await this.devRepo.findOneBy({ adbDevice: In([adbSerial]) });
    if (!data) throw new NotFoundException(`Dispositivo no encontrado: ${adbSerial}`);
    await this.gpio.pulse(data.gpioPin, data.msPulse);
  }

  // ─── Thermal & ADB addr ───────────────────────────────────────────────────────

  async create(data: CreateThermalDto) {
    return this.thermalRepo.save(data);
  }

  async updateAdbAddr(data: any) {
    return this.devRepo.update(
      { deviceId: data.deviceId ?? 9 },
      { adbDevice: data.deviceName },
    );
  }
}
