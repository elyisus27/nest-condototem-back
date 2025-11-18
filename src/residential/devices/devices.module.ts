import { Module } from '@nestjs/common';


import { Device } from '../a.entities/dev_device.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdbController } from './controllers/adb.controller';
import { AdbService } from './application/adb.service';
import { AutomationService } from './application/automation.service';
import { AutomationFactory } from './automation/automation.factory';
import { CondoviveService } from './automation/condovive.service';
import { SequenceExecutorService } from './automation/sequence-executore.service';
//import { AutomationController } from './controllers/automation.controller';
import { DevicesService } from './application/devices.service';
import { DevicesController } from './devices.controller';
import { AutomationSchedule } from './automation/automation.schedule';
import { GpioService } from './application/gpio.service';


@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController,  AdbController],
  providers: [DevicesService, AutomationService, AdbService, AutomationFactory, SequenceExecutorService, AutomationSchedule, GpioService],
  exports: [DevicesService, GpioService],
})
export class DevicesModule { }
