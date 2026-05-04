#!/bin/bash
# ============================================================
# 01_update_automation_service.sh
# Reemplaza automation.service.ts con el flujo determinista
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

TARGET="../src/residential/devices/application/automation.service.ts"

cat > "$TARGET" << 'ENDOFFILE'
// src/residential/devices/application/automation.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AdbInstance } from './adb.service';
import { Device } from '../../a.entities/dev_device.entity';
import { GpioService } from './gpio.service';
import { SequenceExecutorService } from '../automation/sequence-executore.service';
import { PULSE_ON_DENY } from '../../../config/constants';

@Injectable()
export class AutomationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutomationService.name);
  private running = false;
  private adb: AdbInstance | null = null;

  constructor(
    @InjectRepository(Device)
    private readonly devRepo: Repository<Device>,
    private readonly gpioService: GpioService,
    private readonly seqExecutor: SequenceExecutorService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  async onApplicationBootstrap() {
    this.logger.log('🚀 AutomationService bootstrap — iniciando ciclo...');
    await this.startCycle();
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
      // TODO: ajustar predicado con XML real de la pantalla de cámara
      const cameraReady = await this.adb.waitForUI(
        (xml) => xml.includes('Cancelar') || xml.includes('Cancel'),
        12000,
      );
      if (!cameraReady) {
        this.logger.warn('⚠ UI Cámara no apareció — reintentando ciclo completo');
        return this.scheduleRetry();
      }

      this.logger.log('✅ Cámara activa — entrando en loop de espera');
      await this.runAutomationLoop();

    } catch (err: any) {
      this.logger.error(`❌ Error en initAndNavigate: ${err.message}`);
      this.scheduleRetry();
    }
  }

  // ─── Loop principal (idle esperando evento logcat) ────────────────────────────

  private async runAutomationLoop(): Promise<void> {
    await this.adb.startListeningForCameraEvents();

    while (this.running) {
      this.logger.log('[LOOP] Idle — esperando evento cameraClosed...');

      const state: string = await new Promise((resolve) => {
        this.adb.cameraEvent.once('cameraClosed', (s: string) => resolve(s));
      });

      if (!this.running) break;

      this.logger.log(`[LOOP] Evento recibido: "${state}"`);

      // Leer device fresco para tener coords/steps/gpio actualizados desde BD
      const device = await this.loadActiveDevice();
      if (!device) break;

      // GPIO
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
        await this.adb.delay(2000);
        await this.seqExecutor.executeSequence(sequence as any, this.adb);
      }

      // Volver al estado inicial después de cada acción
      this.logger.log('[LOOP] Regresando a estado inicial...');
      this.adb.stopListening();
      await this.adb.delay(1000);
      await this.initAndNavigate();
      return;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async loadActiveDevice(): Promise<Device | null> {
    const device = await this.devRepo.findOne({
      where: { tagActive: 1 },
      relations: ['sequences', 'sequences.steps'],
    });
    if (!device) {
      this.logger.error('No se encontró un dispositivo activo en BD');
      return null;
    }
    this.logger.debug(`[DB] Device cargado: ${device.deviceName} @ ${device.adbDevice}`);
    return device;
  }

  private scheduleRetry(ms = 8000): void {
    if (!this.running) return;
    this.logger.log(`⏳ Reintentando ciclo en ${ms / 1000}s...`);
    setTimeout(() => {
      if (this.running) this.initAndNavigate();
    }, ms);
  }

  // ─── Utilidades públicas (para el controller) ────────────────────────────────

  public async getScreenshot(): Promise<string | null> {
    if (!this.adb) return null;
    return this.adb.takeScreenshot();
  }
}
ENDOFFILE

echo "✅ automation.service.ts actualizado en $TARGET"
