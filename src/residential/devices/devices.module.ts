import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Devices } from '../a.entities/devices.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CondoviveService } from './condovive.service';
import { AdbService } from './adb.service';

@Module({
  imports: [TypeOrmModule.forFeature([Devices])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports:[DevicesService]
})
export class DevicesModule { }
