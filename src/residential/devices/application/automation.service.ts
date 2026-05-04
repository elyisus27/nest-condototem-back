// src/residential/devices/application/automation.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AdbInstance, CameraEvent } from './adb.service';
import { Device } from '../../a.entities/dev_device.entity';
import { CrossingLog } from '../../a.entities/dev_crossing_log.entity';
import { GpioService } from './gpio.service';
import { SequenceExecutorService } from '../automation/sequence-executore.service';
import { PULSE_ON_DENY } from '../../../config/constants';
import { spawnSync } from 'child_process';

@Injectable()
export class AutomationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutomationService.name);
  private running = false;
  private adb: AdbInstance | null = null;

  constructor(
    @InjectRepository(Device)
    private readonly devRepo: Repository<Device>,
    @InjectRepository(CrossingLog)
    private readonly crossingRepo: Repository<CrossingLog>,
    private readonly gpioService: GpioService,
    private readonly seqExecutor: SequenceExecutorService,
    private readonly configService: ConfigService,
  ) { }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  async onApplicationBootstrap() {
    this.logger.log('🚀 AutomationService bootstrap — iniciando ciclo...');

    setImmediate(() => {
      this.startCycle().catch(err => {
        this.logger.error('Error en startCycle', err);
      });
    });
  }

  // ─── Ciclo principal ─────────────────────────────────────────────────────────

  public async startCycle(): Promise<void> {
    // Siempre leer device fresco desde BD (captura cambios de IP/serial en caliente)
    const device = await this.loadActiveDevice();
    if (!device) return;

    this.adb = new AdbInstance(device);
    this.running = true;

    await this.initAndNavigate();
  }

  public stopCycle(): void {
    this.running = false;
    if (this.adb) {
      this.adb.stopListening();
      this.adb = null;
    }
    this.logger.log('🛑 Ciclo detenido');
  }

  public async restartCycle(): Promise<void> {
    this.logger.log('🔄 Reiniciando ciclo...');
    this.stopCycle();
    await new Promise((r) => setTimeout(r, 1000));
    await this.startCycle();
  }

  // ─── Flujo de navegación determinista ────────────────────────────────────────

  private async initAndNavigate(): Promise<void> {
    try {
      this.logger.log('▶ [STEP 1] Force stop + clear logcat + launch app');
      await this.adb.forceStopApp();
      await this.adb.delay(1000);
      await this.adb.clearLogcat();
      await this.adb.delay(500);
      await this.adb.launchApp();

      this.logger.log('▶ [STEP 2] Esperando Home UI (directorio cargado)...');
      const homeReady = await this.adb.waitForUI(
        (xml) => xml.includes('Visitas') && xml.includes('Directorio'),
        20000,
      );
      if (!homeReady) {
        this.logger.warn('⚠ Home UI no apareció — reintentando ciclo completo');
        return this.scheduleRetry();
      }

      this.logger.log('▶ [STEP 3] Click Visitas');
      await this.adb.tap(54, 426);

      this.logger.log('▶ [STEP 4] Esperando UI Visitas (Escanear QR cargado)...');
      const visitasReady = await this.adb.waitForUI(
        (xml) => xml.includes('Escanear QR'),
        15000,
      );
      if (!visitasReady) {
        this.logger.warn('⚠ UI Visitas no apareció — reintentando ciclo completo');
        return this.scheduleRetry();
      }

      this.logger.log('▶ [STEP 5] Click Escanear QR');
      await this.adb.tap(346, 150);

      this.logger.log('▶ [STEP 6] Esperando UI Cámara activa...');
      // Señal definitiva: resource-id texture_view aparece cuando la cámara está lista
      const cameraReady = await this.adb.waitForUI(
        (xml) => xml.includes('com.condovive.guard:id/texture_view'),
        12000,
      );
      if (!cameraReady) {
        this.logger.warn('⚠ UI Cámara no apareció — reintentando ciclo completo');
        return this.scheduleRetry();
      }

      this.logger.log('▶ [STEP 7] Flip a cámara frontal (tap centro)');
      await this.adb.tap(567, 104);

      this.logger.log('✅ Cámara frontal activa — entrando en loop de espera');
      await this.runAutomationLoop();

    } catch (err: any) {
      this.logger.error(`❌ Error en initAndNavigate: ${err.message}`);
      this.scheduleRetry();
    }
  }

  // ─── Loop principal (idle esperando evento logcat) ────────────────────────────

  private async runAutomationLoop(): Promise<void> {
    // Iniciar logcat UNA sola vez antes del loop
    await this.adb.startListeningForCameraEvents();

    while (this.running) {
      this.logger.log('[LOOP] Idle — esperando evento cameraClosed...');

      // Registrar el listener ANTES de que pueda llegar el evento,
      // usando una Promise que se resuelve en el próximo emit
      const event: CameraEvent = await this.waitForCameraEvent();
      const state = event.state;

      if (!this.running) break;

      this.logger.log(`[LOOP] Evento recibido: "${state}" | host: ${event.hostName ?? '-'} | visitor: ${event.visitorName ?? '-'} | tipo: ${event.visitType ?? '-'}`);

      // Leer device fresco para tener coords/steps/gpio actualizados desde BD
      const device = await this.loadActiveDevice();
      if (!device) break;

      // GPIO — prioridad máxima: abrir barrera antes de cualquier otra cosa
      if (state === 'aceptar visita' && device.gpioPin) {
        this.logger.log(`🔓 Pulso GPIO pin ${device.gpioPin}`);
        await this.gpioService.pulse(device.gpioPin, device.msPulse);
      } else if (
        state === 'denegar visita' &&
        this.configService.get(PULSE_ON_DENY) &&
        device.gpioPin
      ) {
        await this.gpioService.pulse(device.gpioPin, device.msPulse);
      }

      // Secuencia dinámica (leída fresca desde BD en cada evento)
      const sequence = device.sequences?.find((s) =>
        s.name.toLowerCase().includes(state.toLowerCase()),
      );
      if (sequence) {
        await this.adb.delay(500);
        await this.seqExecutor.executeSequence(sequence as any, this.adb);
      }

      // Guardar crossing log — al final, después de GPIO y secuencia
      await this.saveCrossingLog(event);

      // La secuencia ya devolvió la app al estado idle (cámara frontal activa).
      // El loop continúa — registra el próximo once ANTES de volver al tope.
    }
  }

  /**
   * Espera el próximo evento cameraClosed de forma segura.
   * Registra el listener SINCRÓNICAMENTE antes de await,
   * evitando la condición de carrera donde el evento llega
   * antes de que el listener esté registrado.
   */
  private waitForCameraEvent(): Promise<CameraEvent> {
    return new Promise((resolve) => {
      // once se registra de forma síncrona, sin ningún await previo
      this.adb.cameraEvent.once('cameraClosed', (e: CameraEvent) => resolve(e));
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async loadActiveDevice(): Promise<Device | null> {
    const device = await this.devRepo.findOne({
      where: { tagActive: 1 },
      relations: ['sequences', 'sequences.steps'],
    });

    // Null-check ANTES de acceder a propiedades
    if (!device) {
      this.logger.error('No se encontró un dispositivo activo en BD');
      return null;
    }

    const serial = device.adbDevice;

    // Si el serial es IP:puerto, intentar conectar por WiFi
    if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(serial)) {
      this.logger.log(`→ ADB connect ${serial}`);
      const result = spawnSync('adb', ['connect', serial], { encoding: 'utf8' });

      if (result.error) {
        this.logger.error(`❌ Error conectando ${serial}: ${result.error.message}`);
        return null
      } else if (result.stdout.includes('connected')) {
        this.logger.log(`✅ ${serial} conectado vía WiFi`);
        return device
      } else {
        this.logger.warn(`⚠️ ${serial}: ${result.stdout.trim()}`);
        return null
      }
    }

    // this.logger.debug(`[DB] Device cargado: ${device.deviceName} @ ${device.adbDevice}`);
    // return device;
  }

  private scheduleRetry(ms = 8000): void {
    if (!this.running) return;
    this.logger.log(`⏳ Reintentando ciclo en ${ms / 1000}s...`);
    setTimeout(() => {
      if (this.running) this.initAndNavigate();
    }, ms);
  }

  // ─── Crossing log ────────────────────────────────────────────────────────────

  private async saveCrossingLog(event: CameraEvent): Promise<void> {
    try {
      const log = this.crossingRepo.create({
        state: event.state,
        host_name: event.hostName,
        host_unit: event.hostUnit,
        co_host: event.coHost,
        visitor_name: event.visitorName,
        visitor_phone: event.visitorPhone,
        visitor_email: event.visitorEmail,
        visit_type: event.visitType,
        raw_xml: event.rawXml,
      });
      await this.crossingRepo.save(log);
      this.logger.log(`💾 CrossingLog guardado — state: ${event.state}, host: ${event.hostName ?? '-'}`);
    } catch (err: any) {
      // No rompemos el ciclo si falla el log
      this.logger.error(`❌ Error guardando CrossingLog: ${err.message}`);
    }
  }

  // ─── Utilidades públicas (para el controller) ────────────────────────────────

  public async getScreenshot(): Promise<string | null> {
    if (!this.adb) return null;
    return this.adb.takeScreenshot();
  }

  // utilidades publicas para el schedule
  public async recoverOffline(serial: string): Promise<void> {
    try {
      this.logger.warn(`🛠 Recovery offline para ${serial}`);

      if (this.adb) {
        this.adb.stopListening();
      }

      spawnSync('adb', ['disconnect', serial], { encoding: 'utf8' });
      spawnSync('adb', ['connect', serial], { encoding: 'utf8' });

      // wake-up shell (descubrimiento empírico tuyo)
      spawnSync('adb', ['-s', serial, 'shell', 'dumpsys', 'battery'], { encoding: 'utf8' });
      spawnSync('adb', ['-s', serial, 'shell', 'dumpsys', 'battery'], { encoding: 'utf8' });

      // reinicia ciclo completo usando arquitectura existente
      await this.restartCycle();

      this.logger.log(`✅ Recovery completado ${serial}`);

    } catch (err: any) {
      this.logger.error(`❌ Recovery falló ${serial}: ${err.message}`);
    }
  }
}
