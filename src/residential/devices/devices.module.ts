import { Module } from '@nestjs/common';


import { Device } from '../a.entities/dev_device.entity';
import { CrossingLog } from '../a.entities/dev_crossing_log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdbService } from './application/adb.service';



import { SequenceExecutorService } from './automation/sequence-executore.service';
//import { AutomationController } from './controllers/automation.controller';

import { DevicesController } from './devices.controller';

import { GpioService } from './application/gpio.service';
import { DeviceThermalLog } from '../a.entities/dev_thermal_log.entity';
import { DevicesService } from './devices.service';
import { AutomationService } from './application/automation.service';
import { DevicesSchedule } from './devices.schedule';


@Module({
  imports: [TypeOrmModule.forFeature([Device, DeviceThermalLog, CrossingLog])],
  controllers: [DevicesController],
  providers: [DevicesService, AdbService, SequenceExecutorService, GpioService, AutomationService,DevicesSchedule],
  exports: [DevicesService, GpioService],
})
export class DevicesModule { }
