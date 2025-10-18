// src/automation.schedule.ts
import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { DevicesService } from '../application/devices.service';
import { AutomationService } from '../application/automation.service';



@Injectable()
export class AutomationSchedule {
  private readonly logger = new Logger('AutomationSchedule');


  constructor(private readonly automationService: AutomationService) { }

  @Timeout(3000)
  async startAutomation() {
    await this.automationService.initializeCycles();
    console.log('✅ Todos los ciclos inicializados.');
  }
}