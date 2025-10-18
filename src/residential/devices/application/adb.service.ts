// src/residential/devices/application/adb.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { Device } from '../../a.entities/dev_device.entity';

@Injectable()
export class AdbService {
  private readonly logger = new Logger(AdbService.name);

  // Método público para obtener una instancia concreta asociada a un Device
  public createInstance(device: Device): AdbInstance {
    return new AdbInstance(device);
  }

  // Alias: si alguna parte del código llama por serial directo
  public async takeScreenshot(serial: string): Promise<string> {
    const inst = new AdbInstance({ adbDevice: serial } as any);
    return inst.takeScreenshot();
  }
}

/**
 * Clase que contiene la implementación real por dispositivo.
 * Mantiene logcat, runAdb y métodos típicos.
 */
export class AdbInstance {
  private readonly logger: Logger;
  private logProcess: any;
  public readonly cameraEvent = new EventEmitter();
  private readonly triggerLog = 'disconnect: Disconnected client for camera 1';
  private readonly APP_PACKAGE = 'com.condovive.guard';

  constructor(public readonly device: Device) {
    this.logger = new Logger(`AdbInstance - ${this.device.adbDevice}`);
  }

  // Ejecuta comando adb -s <serial> <...args>
  public runAdb(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('adb', ['-s', this.device.adbDevice, ...args]);
      let out = '';
      proc.stdout.on('data', (d) => (out += d.toString()));
      proc.stderr.on('data', (d) => {
        const msg = d.toString();
        // Filtra las salidas no críticas del monkey o logs del sistema
        if (!msg.includes('monkey')) {
          //this.logger.error(msg);
        } else {
          this.logger.debug(`[adb:${this.device.adbDevice}] ${msg.trim()}`);
        }
      });
      proc.on('close', (code) => {
        if (code === 0) resolve(out);
        else reject(new Error(`ADB failed (${code}) - ${this.device.adbDevice}`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  public delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Tap
  public async tap(x: number, y: number) {
    await this.runAdb(['shell', 'input', 'tap', x.toString(), y.toString()]);
  }

  // Swipe
  public async swipe(x1: number, y1: number, x2: number, y2: number, duration: number) {
    await this.runAdb([
      'shell',
      'input',
      'swipe',
      x1.toString(),
      y1.toString(),
      x2.toString(),
      y2.toString(),
      (duration || 300).toString(),
    ]);
  }

  // Tomar screenshot (base64)
  public takeScreenshot(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('adb', ['-s', this.device.adbDevice, 'exec-out', 'screencap', '-p']);
      const chunks: Buffer[] = [];
      proc.stdout.on('data', (d) => chunks.push(d));
      proc.stderr.on('data', (d) => this.logger.error(`[screencap] ${d.toString()}`));
      proc.on('close', (code) => {
        if (code === 0) resolve(Buffer.concat(chunks).toString('base64'));
        else reject(new Error(`screencap failed ${code}`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Dump UI (uiautomator)
  private dumpUI(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('adb', ['-s', this.device.adbDevice, 'exec-out', 'uiautomator', 'dump', '/dev/tty']);
      let out = '';
      proc.stdout.on('data', (d) => (out += d.toString()));
      proc.stderr.on('data', (d) => this.logger.error(`[dumpUI] ${d.toString()}`));
      proc.on('close', () => resolve(out));
      proc.on('error', (err) => reject(err));
    });
  }

  // Limpia logcat -> público y dirigido al dispositivo
  public async clearLogcat(): Promise<void> {
    await this.runAdb(['logcat', '-c']);
    this.logger.debug(`[ADB:${this.device.adbDevice}] logcat limpiado`);
  }

  // Force stop app
  public async forceStopApp(): Promise<void> {
    this.logger.log(`[ADB:${this.device.adbDevice}] force-stop ${this.APP_PACKAGE}`);
    await this.runAdb(['shell', 'am', 'force-stop', this.APP_PACKAGE]);
  }

  // Lanzar app
  public async launchApp(): Promise<void> {
    this.logger.log(`[ADB:${this.device.adbDevice}] launching ${this.APP_PACKAGE}`);
    await this.runAdb(['shell', 'monkey', '-p', this.APP_PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1']);
  }

  // Escuchar logcat (CameraService) -> emite cameraClosed events
  public async startListeningForCameraEvents(): Promise<void> {
    if (this.logProcess) {
      this.logger.log(`[ADB:${this.device.adbDevice}] logcat listener already active`);
      return;
    }

    this.logProcess = spawn('adb', ['-s', this.device.adbDevice, 'logcat', '-s', 'CameraService']);
    this.logger.log(`[ADB:${this.device.adbDevice}] start listening CameraService logcat`);

    this.logProcess.stdout.on('data', async (chunk: Buffer) => {
      const line = chunk.toString();
      if (line.includes(this.triggerLog)) {
        this.logger.log(`[ADB:${this.device.adbDevice}] Camera event trigger detected. Dumping UI...`);
        let xml = '';
        let attempts = 0;
        let found = false;
        while (!found && attempts < 5) {
          xml = await this.dumpUI();
          if (xml.includes('Esta invitación ha expirado') || xml.includes('Anfitrión')) found = true;
          else {
            attempts++;
            await this.delay(1000);
          }
        }

        if (xml.includes('Esta invitación ha expirado')) this.cameraEvent.emit('cameraClosed', 'denegar visita');
        else if (xml.includes('Anfitrión')) this.cameraEvent.emit('cameraClosed', 'aceptar visita');
        else this.cameraEvent.emit('cameraClosed', 'unknown');
      }
    });

    this.logProcess.stderr.on('data', (d) => this.logger.error(`[adb-logcat-stderr] ${d.toString()}`));
    this.logProcess.on('close', (code) => {
      this.logger.warn(`[ADB:${this.device.adbDevice}] logcat process closed ${code}`);
      this.logProcess = null;
    });
  }

  // Detener listener
  public stopListening(): void {
    if (this.logProcess) {
      this.logProcess.kill();
      this.logProcess = null;
      this.logger.log(`[ADB:${this.device.adbDevice}] logcat listener stopped`);
    }
  }


}
