#!/bin/bash
# ============================================================
# 09_add_crossing_log.sh
# - Nueva entidad dev_crossing_log
# - Parser de XML dentro de AdbInstance (cameraClosed devuelve objeto)
# - Save en AutomationService al final del loop
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

# ── 1. Entidad CrossingLog ────────────────────────────────────
cat > "../src/residential/a.entities/dev_crossing_log.entity.ts" << 'ENDOFFILE'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dev_crossing_log')
export class CrossingLog {

  @PrimaryGeneratedColumn()
  id: number;

  /** 'aceptar visita' | 'denegar visita' | 'unknown' */
  @Column({ length: 50 })
  state: string;

  /** Nombre del anfitrión principal (colono dueño del QR) */
  @Column({ nullable: true, length: 255 })
  hostName: string;

  /** Número de unidad del anfitrión, ej: "1132 - 15" */
  @Column({ nullable: true, length: 50 })
  hostUnit: string;

  /** Co-anfitrión si existe */
  @Column({ nullable: true, length: 255 })
  coHost: string;

  /** Nombre del visitante */
  @Column({ nullable: true, length: 255 })
  visitorName: string;

  /** Celular del visitante */
  @Column({ nullable: true, length: 50 })
  visitorPhone: string;

  /** Correo del visitante */
  @Column({ nullable: true, length: 255 })
  visitorEmail: string;

  /** Tipo de visita: "Visita General", "Paquetería", etc. */
  @Column({ nullable: true, length: 100 })
  visitType: string;

  /** XML raw del dump para futura reanalisis */
  @Column({ nullable: true, type: 'text' })
  rawXml: string;

  @CreateDateColumn()
  crossingAt: Date;
}
ENDOFFILE

echo "✅ dev_crossing_log.entity.ts creado"

# ── 2. Actualizar AdbInstance: cameraClosed emite objeto ──────
python3 << 'PYEOF'

with open('../src/residential/devices/application/adb.service.ts', 'r') as f:
    content = f.read()

# Agregar interfaz CameraEvent justo antes de la clase AdbService
interface_block = """
// Datos extraídos del UI dump al detectar evento de cámara
export interface CameraEvent {
  state: 'aceptar visita' | 'denegar visita' | 'unknown';
  hostName:     string | null;
  hostUnit:     string | null;
  coHost:       string | null;
  visitorName:  string | null;
  visitorPhone: string | null;
  visitorEmail: string | null;
  visitType:    string | null;
  rawXml:       string;
}

"""

# Insertar antes de @Injectable()
old_injectable = "@Injectable()\nexport class AdbService {"
new_injectable = interface_block + "@Injectable()\nexport class AdbService {"

if old_injectable in content:
    content = content.replace(old_injectable, new_injectable, 1)
    print("✅ Interfaz CameraEvent agregada")
else:
    print("⚠  No se encontró @Injectable() AdbService — agrega la interfaz manualmente antes de la clase AdbService")

# Reemplazar el bloque del emit dentro de startListeningForCameraEvents
old_emit_block = """        if (xml.includes('Esta invitación ha expirado') || xml.includes('Esta invitación ha sido registrada previamente') || xml.includes('Esta invitación ha sido')) this.cameraEvent.emit('cameraClosed', 'denegar visita');
        else if (xml.includes('Anfitrión') || xml.includes('Host') || xml.includes('Co-Anfitriones')) this.cameraEvent.emit('cameraClosed', 'aceptar visita');
        else this.cameraEvent.emit('cameraClosed', 'unknown');"""

new_emit_block = """        // Determinar estado
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

        this.cameraEvent.emit('cameraClosed', event);"""

if old_emit_block in content:
    content = content.replace(old_emit_block, new_emit_block)
    print("✅ emit actualizado para enviar CameraEvent")
else:
    print("⚠  Bloque emit no encontrado — revisa espaciado en adb.service.ts")

# Agregar método parseXmlData antes del cierre de la clase AdbInstance
old_end_region = "  //endregion\n\n}"

new_parse_method = """  //endregion

  // ─── Parser de datos del UI dump ─────────────────────────────

  private parseXmlData(xml: string): Omit<CameraEvent, 'state' | 'rawXml'> {
    // Extraer todos los textos del XML con sus bounds
    const nodeRegex = /text="([^"]+)"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"/g;
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
    const hostNameNode = topNodes.find(n => n.text.length > 5 && n !== unitNode &&
      !['La Reserva', 'Unidades', 'Directorio', 'Visitas', 'Morosos'].includes(n.text));
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
      coHost,
      visitorName:  getValue('Nombre Visita'),
      visitorPhone: getValue('Celular'),
      visitorEmail: getValue('Correo'),
      visitType,
    };
  }

}
"""

# Reemplazar el viejo cierre de clase
if old_end_region in content:
    content = content.replace(old_end_region, new_parse_method)
    print("✅ parseXmlData agregado a AdbInstance")
else:
    print("⚠  No se encontró //endregion — agrega parseXmlData manualmente al final de AdbInstance")

with open('../src/residential/devices/application/adb.service.ts', 'w') as f:
    f.write(content)

print("✅ adb.service.ts actualizado")
PYEOF

# ── 3. Actualizar AutomationService: importar entidad + save ──
python3 << 'PYEOF'
with open('../src/residential/devices/application/automation.service.ts', 'r') as f:
    content = f.read()

# Agregar import de CrossingLog y Repository
old_imports = """import { AdbInstance } from './adb.service';
import { Device } from '../../a.entities/dev_device.entity';"""

new_imports = """import { AdbInstance, CameraEvent } from './adb.service';
import { Device } from '../../a.entities/dev_device.entity';
import { CrossingLog } from '../../a.entities/dev_crossing_log.entity';"""

if old_imports in content:
    content = content.replace(old_imports, new_imports)
    print("✅ Imports actualizados")
else:
    print("⚠  Imports no encontrados — agrega manualmente: CameraEvent y CrossingLog")

# Agregar Repository<CrossingLog> al constructor
old_constructor_inject = """  constructor(
    @InjectRepository(Device)
    private readonly devRepo: Repository<Device>,"""

new_constructor_inject = """  constructor(
    @InjectRepository(Device)
    private readonly devRepo: Repository<Device>,
    @InjectRepository(CrossingLog)
    private readonly crossingRepo: Repository<CrossingLog>,"""

if old_constructor_inject in content:
    content = content.replace(old_constructor_inject, new_constructor_inject)
    print("✅ crossingRepo inyectado")
else:
    print("⚠  Constructor no encontrado — agrega @InjectRepository(CrossingLog) manualmente")

# Cambiar tipo del evento en waitForCameraEvent y runAutomationLoop
old_wait = """  private waitForCameraEvent(): Promise<string> {
    return new Promise((resolve) => {
      // once se registra de forma síncrona, sin ningún await previo
      this.adb.cameraEvent.once('cameraClosed', (s: string) => resolve(s));
    });
  }"""

new_wait = """  private waitForCameraEvent(): Promise<CameraEvent> {
    return new Promise((resolve) => {
      // once se registra de forma síncrona, sin ningún await previo
      this.adb.cameraEvent.once('cameraClosed', (e: CameraEvent) => resolve(e));
    });
  }"""

if old_wait in content:
    content = content.replace(old_wait, new_wait)
    print("✅ waitForCameraEvent actualizado a CameraEvent")
else:
    print("⚠  waitForCameraEvent no encontrado")

# Actualizar el loop para usar el evento completo
old_loop_event = """      // Registrar el listener ANTES de que pueda llegar el evento,
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
        await this.adb.delay(500);
        await this.seqExecutor.executeSequence(sequence as any, this.adb);
      }

      // La secuencia ya devolvió la app al estado idle (cámara frontal activa).
      // El loop continúa — registra el próximo once ANTES de volver al tope."""

new_loop_event = """      // Registrar el listener ANTES de que pueda llegar el evento,
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
      // El loop continúa — registra el próximo once ANTES de volver al tope."""

if old_loop_event in content:
    content = content.replace(old_loop_event, new_loop_event)
    print("✅ Loop actualizado para usar CameraEvent y guardar log")
else:
    print("⚠  Bloque loop no encontrado — agrega 'await this.saveCrossingLog(event)' al final del loop manualmente")

# Agregar método saveCrossingLog antes de getScreenshot
old_screenshot = """  // ─── Utilidades públicas (para el controller) ────────────────────────────────

  public async getScreenshot(): Promise<string | null> {"""

new_screenshot = """  // ─── Crossing log ────────────────────────────────────────────────────────────

  private async saveCrossingLog(event: CameraEvent): Promise<void> {
    try {
      const log = this.crossingRepo.create({
        state:        event.state,
        hostName:     event.hostName,
        hostUnit:     event.hostUnit,
        coHost:       event.coHost,
        visitorName:  event.visitorName,
        visitorPhone: event.visitorPhone,
        visitorEmail: event.visitorEmail,
        visitType:    event.visitType,
        rawXml:       event.rawXml,
      });
      await this.crossingRepo.save(log);
      this.logger.log(`💾 CrossingLog guardado — state: ${event.state}, host: ${event.hostName ?? '-'}`);
    } catch (err: any) {
      // No rompemos el ciclo si falla el log
      this.logger.error(`❌ Error guardando CrossingLog: ${err.message}`);
    }
  }

  // ─── Utilidades públicas (para el controller) ────────────────────────────────

  public async getScreenshot(): Promise<string | null> {"""

if old_screenshot in content:
    content = content.replace(old_screenshot, new_screenshot)
    print("✅ saveCrossingLog agregado")
else:
    print("⚠  Bloque getScreenshot no encontrado — agrega saveCrossingLog manualmente")

with open('../src/residential/devices/application/automation.service.ts', 'w') as f:
    f.write(content)

print("✅ automation.service.ts actualizado")
PYEOF

# ── 4. Registrar CrossingLog en DevicesModule ─────────────────
python3 << 'PYEOF'
with open('../src/residential/devices/devices.module.ts', 'r') as f:
    content = f.read()

old_import_entity = "import { Device } from '../a.entities/dev_device.entity';"
new_import_entity = """import { Device } from '../a.entities/dev_device.entity';
import { CrossingLog } from '../a.entities/dev_crossing_log.entity';"""

old_typeorm = "TypeOrmModule.forFeature([Device, DeviceThermalLog])"
new_typeorm = "TypeOrmModule.forFeature([Device, DeviceThermalLog, CrossingLog])"

changed = False
if old_import_entity in content:
    content = content.replace(old_import_entity, new_import_entity)
    changed = True
    print("✅ Import CrossingLog agregado en devices.module.ts")
else:
    print("⚠  Import Device no encontrado en module")

if old_typeorm in content:
    content = content.replace(old_typeorm, new_typeorm)
    changed = True
    print("✅ CrossingLog registrado en TypeOrmModule.forFeature")
else:
    print("⚠  forFeature no encontrado — agrega CrossingLog manualmente")

if changed:
    with open('../src/residential/devices/devices.module.ts', 'w') as f:
        f.write(content)
    print("✅ devices.module.ts actualizado")
PYEOF

echo ""
echo "✅ Script completo. Pasos siguientes:"
echo "   1. npm run start:dev con DATABASE_SYNC=1 → crea tabla dev_crossing_log"
echo "   2. Escanea un QR y verifica el log: '💾 CrossingLog guardado'"
echo "   3. Verifica la tabla en MySQLYog"
