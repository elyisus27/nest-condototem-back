// src/residential/devices/application/adb.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { Device } from '../../a.entities/dev_device.entity';
import { Timeout } from '@nestjs/schedule';


// Datos extraídos del UI dump al detectar evento de cámara
export interface CameraEvent {
  state: 'aceptar visita' | 'denegar visita' | 'unknown';
  hostName: string | null;
  hostUnit: string | null;
  coHost: string | null;
  visitorName: string | null;
  visitorPhone: string | null;
  visitorEmail: string | null;
  visitType: string | null;
  rawXml: string;
}

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


export class AdbInstance {
  private readonly logger: Logger;
  private logProcess: any;
  public readonly cameraEvent = new EventEmitter();
  private readonly triggerLog = 'disconnect: Disconnected client for camera 1';// o camera 1 (frontal)
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
        if (code === 0) {
          resolve(out);
        } else {
          this.logger.error(`[ADB:${this.device.adbDevice}] failed (${code}) args: ${args.join(' ')}`);
          this.logger.error(`[ADB:${this.device.adbDevice}] stdout: ${out}`);
          // Añade una lectura del stderr acumulado:
          // (declara let errOut = ''; arriba)
          // y en stderr.on('data', ...) => errOut += msg
          this.logger.error(`[ADB:${this.device.adbDevice}] stderr: ${out}`);
          reject(new Error(`ADB failed (${code}) - ${this.device.adbDevice}`));
        }
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
        await this.delay(2000);
        let xml = '';
        let attempts = 0;
        let found = false;
        while (!found && attempts < 120) {
          xml = await this.dumpUI();
          //console.log(attempts, xml)
          if (xml.includes('Esta invitación ha expirado') || xml.includes('Esta invitación ha sido registrada previamente') || xml.includes('Anfitrión') || xml.includes('Co-Anfitriones') || xml.includes('Esta invitación ha sido')) found = true;
          else {
            attempts++;
            await this.delay(500);
          }
        }

        // Determinar estado
        let state: 'aceptar visita' | 'denegar visita' | 'unknown';
        if (xml.includes('Esta invitación ha expirado') || xml.includes('Esta invitación ha sido registrada previamente') || xml.includes('Esta invitación ha sido')) {
          state = 'denegar visita';
        } else if (xml.includes('Anfitrión') || xml.includes('Host') || xml.includes('Co-Anfitriones')) {
          state = 'aceptar visita';
        } else {
          state = 'unknown';
        }

        // Parsear datos del XML
        const event: CameraEvent = {
          state,
          ...this.parseXmlData(xml),
          rawXml: xml,
        };

        this.cameraEvent.emit('cameraClosed', event);
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









  //#region new standirezed version


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

  async waitForUI(predicate: (xml: string) => boolean, timeout = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const xml = await this.dumpUI();

      if (predicate(xml)) return true;

      await this.delay(200); // tu polling
    }

    return false;
  }

  // Force stop app
  public async forceStopApp(): Promise<void> {
    this.logger.log(`[ADB:${this.device.adbDevice}] force-stop ${this.APP_PACKAGE}`);
    await this.runAdb(['shell', 'am', 'force-stop', this.APP_PACKAGE]);
  }

  // Limpia logcat -> público y dirigido al dispositivo
  public async clearLogcat(): Promise<void> {
    this.logger.debug(`[ADB:${this.device.adbDevice}] logcat limpiado`);
    await this.runAdb(['logcat', '-c']);
  }

  // Lanzar app
  public async launchApp(): Promise<void> {
    this.logger.log(`[ADB:${this.device.adbDevice}] launching ${this.APP_PACKAGE}`);
    await this.runAdb(['shell', 'monkey', '-p', this.APP_PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1']);
  }




  //endregion

  // ─── Parser de datos del UI dump ─────────────────────────────

  private parseXmlData(xml: string): Omit<CameraEvent, 'state' | 'rawXml'> {
    // Extraer todos los textos del XML con sus bounds
    const nodeRegex = /text="([^"]+)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
    const nodes: { text: string; x1: number; y1: number; x2: number; y2: number; cx: number; cy: number }[] = [];

    let match;
    while ((match = nodeRegex.exec(xml)) !== null) {
      const text = match[1].trim();
      if (!text) continue;
      const x1 = +match[2], y1 = +match[3], x2 = +match[4], y2 = +match[5];
      nodes.push({ text, x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 });
    }

    // Solo nodos en el área de contenido principal (x > 110, fuera del sidebar)
    const main = nodes.filter(n => n.x1 > 110);

    // ── Anfitrión: texto en fila superior (y < 200), x > 110 ──
    // En pantalla expirada: unidad está en y~93, nombre en y~159
    // En pantalla válida: anfitrión/nombre aparecen en filas similares
    const topNodes = main.filter(n => n.y1 < 200).sort((a, b) => a.y1 - b.y1);

    // Unidad: patrón "NNNN - N" o "NNNN-N"
    const unitNode = topNodes.find(n => /^\d{3,4}\s*-\s*\d+$/.test(n.text));
    const hostUnit = unitNode?.text ?? null;

    // Nombre anfitrión: primer texto largo (>5 chars) en área top que no sea unidad
    const hostNameNode = topNodes.find(n =>
      n.text.length > 5 &&
      n !== unitNode &&
      !['La Reserva', 'Unidades', 'Directorio', 'Visitas', 'Morosos'].includes(n.text)
    );
    const hostName = hostNameNode?.text ?? null;

    // ── Co-anfitrión: texto que sigue después de "Co-Anfitriones" o "Co-Host" ──
    const coHostLabelIdx = main.findIndex(n =>
      n.text.includes('Co-Anfitri') || n.text.includes('Co-Host'));
    let coHost: string | null = null;
    if (coHostLabelIdx >= 0) {
      const afterLabel = main.slice(coHostLabelIdx + 1).find(n => n.text.length > 3);
      coHost = afterLabel?.text ?? null;
    }

    // ── Tipo de visita: texto que sigue al ícono de paleta (campo Tipo) ──
    // En el XML aparece label "Tipo" seguido del valor en fila siguiente
    const tipoIdx = main.findIndex(n => n.text === 'Tipo');
    let visitType: string | null = null;
    if (tipoIdx >= 0) {
      const tipoNode = main[tipoIdx];
      const afterTipo = main.find(n => n.y1 > tipoNode.y2 && n.x1 > 110 && n.text.length > 2
        && !['Entrada', 'Salida', 'Rechazar', 'Aprobar'].includes(n.text));
      visitType = afterTipo?.text ?? null;
    }

    // ── Campos del visitante: label + valor en misma fila o fila siguiente ──
    // Patrón: el label (Nombre Visita, Celular, Correo) y el valor están
    // en el mismo bounds o en nodos consecutivos
    const getValue = (labelText: string): string | null => {
      const labelNode = main.find(n => n.text === labelText);
      if (!labelNode) return null;
      // Buscar nodo con mismo y1 o y2 pero diferente texto (el valor)
      const valueNode = main.find(n =>
        n !== labelNode &&
        Math.abs(n.cy - labelNode.cy) < 20 &&
        n.text !== labelText &&
        n.text.length > 0 &&
        n.text !== 'undefined'
      );
      return valueNode?.text ?? null;
    };

    return {
      hostName,
      hostUnit,
      coHost: null,
      visitorName: coHost || getValue('Nombre Visita'),
      visitorPhone: getValue('Celular'),
      visitorEmail: getValue('Correo'),
      visitType,
    };
  }

}

