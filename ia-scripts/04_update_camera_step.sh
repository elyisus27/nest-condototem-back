#!/bin/bash
# ============================================================
# 04_update_camera_step.sh
# - Corrige predicado waitForUI de cámara (usa texture_view)
# - Agrega tap al botón central para cambiar a cámara frontal
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

TARGET="../src/residential/devices/application/automation.service.ts"

# Reemplazar el bloque del Step 6 (placeholder Cancelar) con el real
# Usamos python para hacer el reemplazo de forma segura sin romper el resto

python3 << 'PYEOF'
import re

with open('../src/residential/devices/application/automation.service.ts', 'r') as f:
    content = f.read()

old = """      this.logger.log('▶ [STEP 6] Esperando UI Cámara activa...');
      // TODO: ajustar predicado con XML real de la pantalla de cámara
      const cameraReady = await this.adb.waitForUI(
        (xml) => xml.includes('Cancelar') || xml.includes('Cancel'),
        12000,
      );
      if (!cameraReady) {
        this.logger.warn('⚠ UI Cámara no apareció — reintentando ciclo completo');
        return this.scheduleRetry();
      }

      this.logger.log('✅ Cámara activa — entrando en loop de espera');"""

new = """      this.logger.log('▶ [STEP 6] Esperando UI Cámara activa...');
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

      this.logger.log('✅ Cámara frontal activa — entrando en loop de espera');"""

if old in content:
    content = content.replace(old, new)
    with open('../src/residential/devices/application/automation.service.ts', 'w') as f:
        f.write(content)
    print('✅ Step 6 + Step 7 actualizados en automation.service.ts')
else:
    print('❌ No se encontró el bloque a reemplazar — revisa que el archivo no haya cambiado')
    print('   Busca manualmente el comentario TODO y reemplaza el predicado por:')
    print("   (xml) => xml.includes('com.condovive.guard:id/texture_view')")
    print('   Y agrega después del waitForUI exitoso:')
    print('   await this.adb.tap(567, 104);')
PYEOF
