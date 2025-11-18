// src/residential/devices/automation/sequence-executore.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Sequence } from '../../a.entities/dev_sequence.entity';
import { SequenceStep } from '../../a.entities/dev_sequence_step.entity';
import { AdbInstance } from '../application/adb.service'; // 👈 importa la clase correcta

@Injectable()
export class SequenceExecutorService {
  private readonly logger = new Logger(SequenceExecutorService.name);

  async executeSequence(sequence: Sequence, adb: AdbInstance): Promise<void> {
    //this.logger.log(`▶ Ejecutando secuencia ${sequence.name} con ${sequence.steps.length} pasos`);

    for (const step of sequence.steps.sort((a, b) => a.order - b.order)) {
      await this.executeStep(step, adb);
    }

    //this.logger.log(`✅ Secuencia ${sequence.name} completada`);
  }

  private async executeStep(step: SequenceStep, adb: AdbInstance) { // 👈 tipo correcto
    switch (step.type) {
      case 1: // tap
        this.logger.log(`[STEP ${step.order}] Tap (${step.x1}, ${step.y1})`);
        await adb.tap(step.x1, step.y1);
        break;

      case 2: // swipe
        this.logger.log(`[STEP ${step.order}] Swipe (${step.x1},${step.y1}) -> (${step.x2},${step.y2})`);
        await adb.swipe(step.x1, step.y1, step.x2, step.y2, step.swapTime || 300);
        break;

      default:
        this.logger.warn(`[STEP ${step.order}] Tipo no reconocido: ${step.type}`);
    }

    if (step.delay && step.delay > 0) await adb.delay(step.delay);
  }
}
