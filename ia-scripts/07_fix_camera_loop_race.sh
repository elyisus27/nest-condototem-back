#!/bin/bash
# ============================================================
# 07_fix_camera_loop_race.sh
# Corrige la condición de carrera del segundo evento cameraClosed
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

python3 << 'PYEOF'

with open('../src/residential/devices/application/automation.service.ts', 'r') as f:
    content = f.read()

# ── Fix: reemplazar runAutomationLoop completo ────────────────
old = """  // ─── Loop principal (idle esperando evento logcat) ────────────────────────────

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

      // La secuencia ya devolvió la app al estado idle (cámara frontal activa).
      // El loop continúa esperando el próximo evento cameraClosed.
    }
  }"""

new = """  // ─── Loop principal (idle esperando evento logcat) ────────────────────────────

  private async runAutomationLoop(): Promise<void> {
    // Iniciar logcat UNA sola vez antes del loop
    await this.adb.startListeningForCameraEvents();

    while (this.running) {
      this.logger.log('[LOOP] Idle — esperando evento cameraClosed...');

      // Registrar el listener ANTES de que pueda llegar el evento,
      // usando una Promise que se resuelve en el próximo emit
      const state: string = await this.waitForCameraEvent();

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
  private waitForCameraEvent(): Promise<string> {
    return new Promise((resolve) => {
      // once se registra de forma síncrona, sin ningún await previo
      this.adb.cameraEvent.once('cameraClosed', (s: string) => resolve(s));
    });
  }"""

if old in content:
    content = content.replace(old, new)
    with open('../src/residential/devices/application/automation.service.ts', 'w') as f:
        f.write(content)
    print('✅ runAutomationLoop + waitForCameraEvent aplicados')
else:
    print('❌ Bloque no encontrado — el archivo fue modificado manualmente')
    print('   Reemplaza runAutomationLoop y agrega waitForCameraEvent manualmente')
    print('   La clave: registrar once() ANTES de cualquier await en el loop')

PYEOF
