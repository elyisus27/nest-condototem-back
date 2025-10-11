// src/automation.schedule.ts
import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { DevicesService } from '../residential/devices/devices.service';


@Injectable()
export class AutomationSchedule {
  private readonly logger = new Logger('AutomationSchedule');

  constructor(private readonly devicesService: DevicesService) {}

  @Timeout(3000) // 10 segundos para dar tiempo a que todo cargue
  async startAutomation() {
       
    await this.devicesService.initializeServices();
    
    const services = this.devicesService.getAllServices();
    
    if (services.length > 0) {
      await Promise.all(
        services.map(service => service.runAutomationLoop())
      );
      this.logger.log('✅ Todos los bucles de automatización han sido iniciados.');
    } else {
      this.logger.warn('No se iniciaron bucles de automatización porque no hay dispositivos activos.');
    }
  }
}