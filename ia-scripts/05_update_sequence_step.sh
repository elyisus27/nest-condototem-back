#!/bin/bash
# ============================================================
# 05_update_sequence_step.sh
# - Agrega columnas: description, waitForText a SequenceStep
# - Actualiza SequenceExecutorService para usar waitForUI + loguear description
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

# ── 1. Entidad SequenceStep ──────────────────────────────────
cat > "../src/residential/a.entities/dev_sequence_step.entity.ts" << 'ENDOFFILE'
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Sequence } from './dev_sequence.entity';

@Entity('dev_sequence_step')
export class SequenceStep {

  @PrimaryGeneratedColumn()
  stepId: number;

  @ManyToOne(() => Sequence, (seq) => seq.steps, { onDelete: 'CASCADE' })
  sequence: Sequence;

  @Column({ default: 0 })
  order: number;

  // 1 = tap, 2 = swipe
  @Column({ default: 1 })
  type: number;

  @Column({ nullable: true })
  x1: number;

  @Column({ nullable: true })
  y1: number;

  @Column({ nullable: true })
  x2: number;

  @Column({ nullable: true })
  y2: number;

  @Column({ nullable: true })
  swapTime: number;

  @Column({ nullable: true })
  delay: number;

  // ── Nuevas columnas ──────────────────────────────────────

  /** Descripción legible del paso, aparece en los logs */
  @Column({ nullable: true, length: 255 })
  description: string;

  /**
   * Texto (o resource-id) que debe aparecer en el UI dump
   * ANTES de ejecutar este paso. Si está vacío, no espera.
   * Ejemplos:
   *   'Esta invitación ha expirado'
   *   'Anfitrión'
   *   '¿Deseas rechazar a esta visita?'
   *   '¡Excelente!'
   */
  @Column({ nullable: true, length: 500 })
  waitForText: string;
}
ENDOFFILE

echo "✅ dev_sequence_step.entity.ts actualizado"

# ── 2. SequenceExecutorService ───────────────────────────────
cat > "../src/residential/devices/automation/sequence-executore.service.ts" << 'ENDOFFILE'
// src/residential/devices/automation/sequence-executore.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Sequence } from '../../a.entities/dev_sequence.entity';
import { SequenceStep } from '../../a.entities/dev_sequence_step.entity';
import { AdbInstance } from '../application/adb.service';

@Injectable()
export class SequenceExecutorService {
  private readonly logger = new Logger(SequenceExecutorService.name);

  async executeSequence(sequence: Sequence, adb: AdbInstance): Promise<void> {
    this.logger.log(`▶ Ejecutando secuencia: "${sequence.name}" (${sequence.steps.length} pasos)`);

    for (const step of sequence.steps.sort((a, b) => a.order - b.order)) {
      await this.executeStep(step, adb);
    }

    this.logger.log(`✅ Secuencia "${sequence.name}" completada`);
  }

  private async executeStep(step: SequenceStep, adb: AdbInstance): Promise<void> {
    // ── waitForText: esperar que la UI tenga el texto esperado ──
    if (step.waitForText && step.waitForText.trim() !== '') {
      this.logger.log(`[STEP ${step.order}] ⏳ Esperando UI: "${step.waitForText}"`);
      const found = await adb.waitForUI(
        (xml) => xml.includes(step.waitForText),
        15000,
      );
      if (!found) {
        this.logger.warn(`[STEP ${step.order}] ⚠ waitForText timeout: "${step.waitForText}" — ejecutando step de todos modos`);
      }
    }

    // ── Log con descripción ──────────────────────────────────
    const label = step.description
      ? `"${step.description}"`
      : `tipo ${step.type}`;

    switch (step.type) {
      case 1: // tap
        this.logger.log(`[STEP ${step.order}] Tap (${step.x1}, ${step.y1})  ${label}`);
        await adb.tap(step.x1, step.y1);
        break;

      case 2: // swipe
        this.logger.log(`[STEP ${step.order}] Swipe (${step.x1},${step.y1})→(${step.x2},${step.y2})  ${label}`);
        await adb.swipe(step.x1, step.y1, step.x2, step.y2, step.swapTime || 300);
        break;

      default:
        this.logger.warn(`[STEP ${step.order}] Tipo no reconocido: ${step.type}  ${label}`);
    }

    if (step.delay && step.delay > 0) {
      await adb.delay(step.delay);
    }
  }
}
ENDOFFILE

echo "✅ sequence-executore.service.ts actualizado"
echo ""
echo "👉 Ahora: npm run start:dev con DATABASE_SYNC=1"
echo "   Se crearán las columnas: description, waitForText en dev_sequence_step"
