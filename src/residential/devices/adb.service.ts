import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { Device } from '../a.entities/dev_device.entity';

type CameraState = 'expired' | 'valid' | 'unknown';

@Injectable()
export class AdbService {
  public readonly deviceSerial: string;
  private readonly logger: Logger;
  private readonly triggerLog = 'disconnect: Disconnected client for camera 1';
  private logProcess: any;
  public readonly cameraEvent = new EventEmitter();

  constructor(device: Device) {
    this.deviceSerial = device.adbDevice;
    this.logger = new Logger(`AdbService - ${this.deviceSerial}`);
  }

  public async startListeningForCameraEvents(): Promise<void> {
    if (this.logProcess) {
      this.logger.log('[LOGCAT] Listener ya activo.');
      return;
    }

    this.logProcess = spawn('adb', ['-s', this.deviceSerial, 'logcat', '-s', 'CameraService']);
    this.logger.log('[LOGCAT] Iniciando escucha de eventos de cámara...');


    this.logProcess.stdout.on('data', this.logcatDataHandler);
    this.logProcess.stderr.on('data', (err) => {
      this.logger.error(`[LOGCAT] Error en logcat: ${err.toString()}`);
    });
    this.logProcess.on('close', (code) => {
      this.logger.warn(`[LOGCAT] Proceso de logcat finalizado con código ${code}`);
      this.logProcess = null;
    });
  }

  private logcatDataHandler = async (chunk: Buffer) => {
    const line = chunk.toString();
    if (line.includes(this.triggerLog)) {
      this.logger.log('[EVENT] 📷 Evento de cierre de cámara detectado. Evaluando...');

      this.logProcess.stdout.off('data', this.logcatDataHandler);

      let xml = '';
      let found = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!found && attempts < maxAttempts) {
        this.logger.log(`[EVAL] Intento ${attempts + 1} de ${maxAttempts} para detectar la UI...`);
        xml = await this.dumpUI();

        if (xml.includes('Esta invitación ha expirado') || xml.includes('Anfitrión')) {
          found = true;
        } else {
          attempts++;
          await this.delay(1500);
        }
      }

      if (xml.includes('Esta invitación ha expirado')) {
        this.logger.log("[EVAL] Resultado: cupón expirado");
        this.cameraEvent.emit('cameraClosed', 'expired');
      } else if (xml.includes('Anfitrión')) {
        this.logger.log("[EVAL] Resultado: cupón vigente");
        this.cameraEvent.emit('cameraClosed', 'valid');
      } else {
        this.logger.warn("[EVAL] Resultado: desconocido después de todos los reintentos.");
        this.cameraEvent.emit('cameraClosed', 'unknown');
      }
    }
  };

  public stopListening(): void {
    if (this.logProcess) {
      this.logger.log('[LOGCAT] Deteniendo el proceso listener...');

      // 🚨 IMPORTANTE: Eliminar el listener antes de matar el proceso
      this.logProcess.stdout.off('data', this.logcatDataHandler);

      // Matar el proceso hijo de forma segura
      this.logProcess.kill();
      this.logProcess = null;
      this.logger.log('[LOGCAT] Proceso listener detenido.');
    }
  }

  /** Métodos privados para manejar los comandos de ADB */
  public runAdb(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('adb', ['-s', this.deviceSerial, ...args]);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ADB command failed with code ${code}`));
        }
      });
      proc.on('error', (err) => reject(err));
    });
  }

  private dumpUI(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('adb', ['-s', this.deviceSerial, 'exec-out', 'uiautomator', 'dump', '/dev/tty']);
      let output = '';
      proc.stdout.on('data', (data) => (output += data.toString()));
      proc.stderr.on('data', (err) => this.logger.error(`[DUMP] Error obteniendo UI: ${err.toString()}`));
      proc.on('close', () => resolve(output));
      proc.on('error', reject);
    });
  }

  /** Utilidades públicas que se usan en CondoviveService */
  public delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async tap(x: number, y: number) {
    await this.runAdb(['shell', 'input', 'tap', x.toString(), y.toString()]);
  }

  public async swipe(x1: number, y1: number, x2: number, y2: number, duration: number) {
    await this.runAdb(['shell', 'input', 'swipe', x1.toString(), y1.toString(), x2.toString(), y2.toString(), duration.toString()]);
  }

  private readonly APP_PACKAGE = 'com.condovive.guard';
  public async forceStopApp(): Promise<void> {
    this.logger.log(`[ADB] Deteniendo la aplicación: ${this.APP_PACKAGE}...`);
    await this.runAdb(['shell', 'am', 'force-stop', this.APP_PACKAGE]);
    this.logger.log('[ADB] Aplicación detenida.');
  }

  /** Nuevo método para cerrar todas las aplicaciones de usuario */
  public async forceStopAllApps(): Promise<void> {
    this.logger.log('[ADB] Obteniendo lista de procesos para detener aplicaciones de usuario...');
    const proc = spawn('adb', ['-s', this.deviceSerial, 'shell', 'ps', '-A']);

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    await new Promise<void>((resolve, reject) => {
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`El comando 'ps' de ADB falló con código ${code}`));
          return;
        }
        resolve();
      });
      proc.on('error', (err) => reject(err));
    });

    const lines = output.split('\n');
    const pidsToKill: string[] = [];
    this.logger.log('[ADB] Procesando la lista de procesos...');

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) continue;

      const user = parts[0];
      const pid = parts[1];
      const packageName = parts[parts.length - 1];

      // Evitar procesos del sistema, servicios y procesos con nombres vacíos
      // La heurística más simple es evitar aquellos que empiezan con 'com.android', 'system', etc.
      // O mejor, solo considerar los que tienen un nombre de paquete de app (ej: 'com.google.android.apps.maps')
      if (
        !isNaN(parseInt(pid)) &&
        (packageName.startsWith('com.') || packageName.startsWith('net.') || packageName.startsWith('org.')) &&
        !packageName.includes('com.google.android.gms') &&
        !packageName.includes('com.android.systemui')
      ) {
        this.logger.log(`[ADB] -> Deteniendo proceso de la app: ${packageName} (PID: ${pid})`);
        pidsToKill.push(pid);
      }
    }

    // Ejecuta el comando 'kill' para cada PID
    for (const pid of pidsToKill) {
      try {
        await this.runAdb(['shell', 'kill', pid]);
      } catch (error) {
        this.logger.warn(`[ADB] No se pudo detener el PID ${pid}: ${error.message}`);
      }
    }
    this.logger.log('[ADB] Proceso de detención de todas las aplicaciones finalizado.');
  }

  /** Simula el cierre de todas las aplicaciones abiertas usando la interfaz de usuario */
  public async closeAllApps(): Promise<void> {
    await this.runAdb(['shell', 'input', 'keyevent', '187']);
    await this.delay(1000)
    await this.tap(360, 1300)

  }



  /** Nuevo método para tomar una captura de pantalla */
  public takeScreenshot(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('adb', ['-s', this.deviceSerial, 'exec-out', 'screencap', '-p']);
      const chunks: Buffer[] = [];
      proc.stdout.on('data', (data) => {
        chunks.push(data);
      });
      proc.stderr.on('data', (data) => {
        this.logger.error(`Error en screencap: ${data.toString()}`);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          const buffer = Buffer.concat(chunks);
          const base64Image = buffer.toString('base64');
          resolve(base64Image);
        } else {
          reject(new Error(`El comando screencap falló con código ${code}`));
        }
      });
      proc.on('error', reject);
    });
  }
}
