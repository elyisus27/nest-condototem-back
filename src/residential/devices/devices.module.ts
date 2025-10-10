import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from '../a.entities/dev_device.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CondoviveService } from './condovive.service';
import { AdbService } from './adb.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports:[DevicesService]
})
export class DevicesModule { }
