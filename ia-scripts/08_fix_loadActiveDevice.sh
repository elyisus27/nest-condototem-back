#!/bin/bash
# ============================================================
# 08_fix_loadActiveDevice.sh
# Corrige el null-check en loadActiveDevice (serial antes del guard)
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

python3 << 'PYEOF'

with open('../src/residential/devices/application/automation.service.ts', 'r') as f:
    content = f.read()

old = """  private async loadActiveDevice(): Promise<Device | null> {
    const device = await this.devRepo.findOne({
      where: { tagActive: 1 },
      relations: ['sequences', 'sequences.steps'],
    });
    const serial = device.adbDevice
    if (!device) {
      this.logger.error('No se encontró un dispositivo activo en BD');
      return null;
    } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(serial)) {
      this.logger.log(`→ ADB connect ${serial}`);
      const result = spawnSync('adb', ['connect', serial], { encoding: 'utf8' });

      if (result.error) {
        this.logger.error(`❌ Error conectando ${serial}: ${result.error.message}`);
        
      }

      if (result.stdout.includes('connected')) {
        this.logger.log(`✅ ${serial} conectado vía WiFi`);
      } else {
        this.logger.warn(`⚠️ ${serial}: ${result.stdout.trim()}`);
      }
    }
    this.logger.debug(`[DB] Device cargado: ${device.deviceName} @ ${device.adbDevice}`);
    return device;
  }"""

new = """  private async loadActiveDevice(): Promise<Device | null> {
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
      } else if (result.stdout.includes('connected')) {
        this.logger.log(`✅ ${serial} conectado vía WiFi`);
      } else {
        this.logger.warn(`⚠️ ${serial}: ${result.stdout.trim()}`);
      }
    }

    this.logger.debug(`[DB] Device cargado: ${device.deviceName} @ ${device.adbDevice}`);
    return device;
  }"""

if old in content:
    content = content.replace(old, new)
    with open('../src/residential/devices/application/automation.service.ts', 'w') as f:
        f.write(content)
    print('✅ loadActiveDevice corregido (null-check antes de acceder a serial)')
else:
    print('❌ Bloque no encontrado — edita manualmente:')
    print('   Mueve "const serial = device.adbDevice" a DESPUÉS del "if (!device)" check')

PYEOF
