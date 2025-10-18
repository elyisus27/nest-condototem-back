// src/residential/devices/automation/automation.factory.ts
import { Injectable } from '@nestjs/common';
import { AdbService } from '../application/adb.service';
import { Device } from '../../a.entities/dev_device.entity';
import { CondoviveService } from './condovive.service';
import { AdbInstance } from '../application/adb.service';

@Injectable()
export class AutomationFactory {
  // Nota: inyectamos AdbService si lo necesitas (no usado aquí)
  createCondoviveService(adbInstance: AdbInstance, device: Device): CondoviveService {
    // CondoviveService en esta refactor debe exponerse por métodos, no depender de DI para Device.
    return new CondoviveService(device, adbInstance);
  }
}
