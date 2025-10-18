// src/residential/devices/automation/condovive.service.ts
import { Logger } from '@nestjs/common';
import { AdbInstance } from '../application/adb.service';
import { Device } from '../../a.entities/dev_device.entity';
import { SequenceExecutorService } from './sequence-executore.service';

export class CondoviveService {
  private readonly logger = new Logger(CondoviveService.name);
  private running = false;


  constructor(private device: Device, private adb: AdbInstance,) {
    this.logger = new Logger(`${CondoviveService.name} - ${this.device.adbDevice}`);
  }

  public async initApp() {
    //this.logger.log('[INIT] Cerrando app...');
    await this.adb.forceStopApp();
    await this.adb.delay(1000);

    //this.logger.log('[INIT] Limpiando logcat...');
    await this.adb.clearLogcat();
    await this.adb.delay(1000);

    //this.logger.log('[INIT] Lanzando app...');
    await this.adb.launchApp();
    await this.adb.delay(10000);

    //this.logger.log('[INIT] 🟢 Condovive iniciado');
  }

  public async gotoCamera(seqExecutor?: SequenceExecutorService) {
    if (seqExecutor && this.device.sequences && this.device.sequences.length > 0) {
      const sequence = this.device.sequences.find(s => s.name.toLowerCase().includes('gotocamera'));
      if (sequence) {
        await seqExecutor.executeSequence(sequence as any, this.adb);
      }
    }
  }

  public async startListening() {
    await this.adb.startListeningForCameraEvents();
  }

  public async runAutomationLoop(seqExecutor?: SequenceExecutorService) {
    this.running = true;
    this.logger.log(`Ejecutando ciclo Condovive para ${this.device.deviceName}`);
    // Restore loop logic
    // example: keep listening + wait for camera events and run sequences
    await this.adb.startListeningForCameraEvents();

    // ejemplo de loop básico - adapta según tu antigua lógica:
    while (this.running) {
      this.logger.log(`[LOOP] ${this.device.deviceName} idle waiting...`);
      // Espera evento cameraClosed para ejecutar secuencias, state valid /expired
      const state: any = await new Promise((resolve) => {
        this.adb.cameraEvent.once('cameraClosed', (s) => resolve(s));
      });

      this.logger.log(`[LOOP] ${this.device.deviceName} event ${state}`);

      // Ejecuta la secuencia correspondiente (si hay)
      if (seqExecutor && this.device.sequences && this.device.sequences.length > 0) {

        const sequence = this.device.sequences.find(s => s.name.toLowerCase().includes(state));
        const gotocamSeq = this.device.sequences.find(s => s.name.toLowerCase().includes("gotocamera"));
        if (sequence) {
          await seqExecutor.executeSequence(sequence as any, this.adb);
          await seqExecutor.executeSequence(gotocamSeq as any, this.adb);
        }
      }

      await this.adb.delay(2000);
      if (!this.running) break;
    }
  }

  public stopCycle() {
    this.running = false;
    this.adb.stopListening();
    this.logger.log(`[STOP] ${this.device.deviceName} stopped`);
  }

  public async getDeviceScreenshot() {
    return this.adb.takeScreenshot();
  }

  public async closeAllApps(seqExecutor?: SequenceExecutorService): Promise<void> {
    //this.running = false;
    if (seqExecutor && this.device.sequences && this.device.sequences.length > 0) {
      const sequence = this.device.sequences.find(s => s.name.toLowerCase().includes('closeallapps'));
      
      if (sequence) {
        await this.adb.runAdb(['shell', 'input', 'keyevent', '187']);
        await this.adb.delay(1000);
        await seqExecutor.executeSequence(sequence as any, this.adb);
      }
    }

  }

  public async startCycle(seqExecutor?: SequenceExecutorService): Promise<void> {
    this.logger.log('Starting Condovive services...');
    await this.initApp();
    await this.gotoCamera(seqExecutor);
    this.running = true;
    this.adb.startListeningForCameraEvents();
  }


}
