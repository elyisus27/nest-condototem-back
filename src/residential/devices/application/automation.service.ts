// src/residential/devices/application/automation.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Device } from '../../a.entities/dev_device.entity';
import { AutomationFactory } from '../automation/automation.factory';
import { AdbService } from './adb.service';
import { SequenceExecutorService } from '../automation/sequence-executore.service';
import { CondoviveService } from '../automation/condovive.service';
import { GpioService } from './gpio.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private activeDevices: Record<string, CondoviveService> = {};

  constructor(
    private readonly devicesService: DevicesService,
    private readonly adbService: AdbService,
    private readonly factory: AutomationFactory,
    private readonly executor: SequenceExecutorService,
    private readonly gpioService: GpioService
  ) {}

  // async initializeServices() {
  //   this.logger.log('Cargando dispositivos de la base de datos...');
  //   const devices: Device[] = await this.devicesService.findAll();
  //   const active = devices.filter(d => d.tagActive === 1 && d.tagDelete === 0);

  //   if (active.length === 0) {
  //     this.logger.warn('No se encontraron dispositivos activos.');
  //     return;
  //   }

  //   for (const device of active) {
  //     this.logger.log(`Inicializando servicio para ${device.deviceName} (${device.adbDevice})`);
  //     const adbInstance = this.adbService.createInstance(device);
  //     const condoviveInstance = this.factory.createCondoviveService(adbInstance, device);
  //     this.activeDevices[device.adbDevice] = condoviveInstance;
  //     // registra en devicesService para que controllers puedan encontrar la instancia por serial
  //     this.devicesService.registerService(device.adbDevice, condoviveInstance);
  //   }

  //   this.logger.log(`Servicios de ${active.length} dispositivos inicializados.`);
  // }

  async startCycle(deviceId: number) {
    const devices = await this.devicesService.findAll();
    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) throw new NotFoundException(`Dispositivo ${deviceId} no encontrado.`);
    const condovive = this.activeDevices[device.adbDevice];
    if (!condovive) throw new NotFoundException(`Servicio Condovive no inicializado para ${device.adbDevice}.`);

    this.logger.log(`Iniciando ciclo Condovive para ${device.deviceName}`);
    // iniciar initApp + loop (no bloqueante)
    await condovive.initApp();
    condovive.runAutomationLoop(this.executor).catch(err => this.logger.error(err.message));
  }

  async stopCycle(deviceId: number) {
    const devices = await this.devicesService.findAll();
    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) throw new NotFoundException(`Dispositivo ${deviceId} no encontrado.`);
    const condovive = this.activeDevices[device.adbDevice];
    if (condovive) {
      condovive.stopCycle();
      delete this.activeDevices[device.adbDevice];
      this.devicesService.unregisterService(device.adbDevice);
    }
  }

  async initializeCycles() {
    const devices = await this.devicesService.findAll();
    if (!devices.length) {
      this.logger.warn('No hay dispositivos activos.');
      return;
    }

    for (const device of devices) {
      const adbInstance = this.adbService.createInstance(device);
      const condovive = this.factory.createCondoviveService(adbInstance, device, this.gpioService);
      this.activeDevices[device.adbDevice] = condovive;
      this.devicesService.registerService(device.adbDevice, condovive);
      await condovive.initApp();
      //necesito await condovive.gotocamera o ejecutar secuencia gotocamera.
      await condovive.gotoCamera(this.executor).catch(err => this.logger.error(err.message));

      condovive.runAutomationLoop(this.executor).catch(err => this.logger.error(err.message));
    }

    this.logger.log(`✅ ${devices.length} ciclos de automatización iniciados.`);
  }

  getAllActiveServices() {
    return Object.values(this.activeDevices);
  }
}
