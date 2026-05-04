#!/bin/bash
# ============================================================
# 06_fix_bootstrap.sh
# - onApplicationBootstrap dispara el ciclo sin bloquear NestJS
# - Si no hay dispositivo activo, loguea error y no rompe la app
# - Comenta el bloque initAndNavigate al final del loop (ya lo hiciste tú,
#   pero lo dejamos limpio sin comentarios muertos)
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

python3 << 'PYEOF'

with open('../src/residential/devices/application/automation.service.ts', 'r') as f:
    content = f.read()

# ── Fix 1: bootstrap no-bloqueante ───────────────────────────
old_bootstrap = """  async onApplicationBootstrap() {
    this.logger.log('🚀 AutomationService bootstrap — iniciando ciclo...');
    await this.startCycle();
  }"""

new_bootstrap = """  onApplicationBootstrap() {
    this.logger.log('🚀 AutomationService bootstrap — iniciando ciclo...');
    // No await: el ciclo corre en background, NestJS arranca sin esperar
    this.startCycle().catch((err) =>
      this.logger.error(`Error al iniciar ciclo: ${err.message}`),
    );
  }"""

# ── Fix 2: loop limpio sin comentarios muertos ────────────────
old_loop_end = """      // Volver al estado inicial después de cada acción
      this.logger.log('[LOOP] Regresando a estado inicial...');
      this.adb.stopListening();
      await this.adb.delay(1000);
      await this.initAndNavigate();
      return;"""

new_loop_end = """      // La secuencia ya devolvió la app al estado idle (cámara frontal activa).
      // El loop continúa esperando el próximo evento cameraClosed."""

# También puede estar comentado como lo dejaste tú:
old_loop_end_commented = """      // Volver al estado inicial después de cada acción
      // this.logger.log('[LOOP] Regresando a estado inicial...');
      // this.adb.stopListening();
      // await this.adb.delay(1000);
      // await this.initAndNavigate();
      // return;"""

# ── Fix 3: startCycle robusto sin dispositivo ─────────────────
old_start = """  public async startCycle(): Promise<void> {
    // Siempre leer device fresco desde BD (captura cambios de IP/serial en caliente)
    const device = await this.loadActiveDevice();
    if (!device) return;

    this.adb = new AdbInstance(device);
    this.running = true;

    await this.initAndNavigate();
  }"""

new_start = """  public async startCycle(): Promise<void> {
    // Siempre leer device fresco desde BD (captura cambios de IP/serial en caliente)
    const device = await this.loadActiveDevice();
    if (!device) {
      this.logger.warn('⚠ No hay dispositivo activo. El ciclo no inicia. Verifica la BD.');
      return;
    }

    if (this.running) {
      this.logger.warn('⚠ startCycle llamado pero el ciclo ya está corriendo. Ignorado.');
      return;
    }

    this.adb = new AdbInstance(device);
    this.running = true;

    await this.initAndNavigate();
  }"""

changes = 0

if old_bootstrap in content:
    content = content.replace(old_bootstrap, new_bootstrap)
    print('✅ Fix 1: bootstrap no-bloqueante aplicado')
    changes += 1
else:
    print('⚠  Fix 1: bloque bootstrap no encontrado (¿ya estaba cambiado?)')

if old_loop_end in content:
    content = content.replace(old_loop_end, new_loop_end)
    print('✅ Fix 2a: loop end limpiado')
    changes += 1
elif old_loop_end_commented in content:
    content = content.replace(old_loop_end_commented, new_loop_end)
    print('✅ Fix 2b: loop end (comentado) limpiado')
    changes += 1
else:
    print('⚠  Fix 2: bloque loop end no encontrado — revisa manualmente que no quede initAndNavigate() al final del while')

if old_start in content:
    content = content.replace(old_start, new_start)
    print('✅ Fix 3: startCycle robusto aplicado')
    changes += 1
else:
    print('⚠  Fix 3: bloque startCycle no encontrado (¿ya estaba cambiado?)')

if changes > 0:
    with open('../src/residential/devices/application/automation.service.ts', 'w') as f:
        f.write(content)
    print(f'\n✅ {changes} cambios escritos en automation.service.ts')
else:
    print('\n❌ No se escribió nada. Revisa el archivo manualmente.')

PYEOF
