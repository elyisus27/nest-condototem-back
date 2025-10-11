import { Injectable, Logger } from '@nestjs/common';
import { AdbService } from './adb.service';

// Define las interfaces/tipos de tus entidades para mayor claridad
interface Step {
    stepId: number;
    order: number;
    type: 1 | 2; // 1: Tap, 2: Swipe
    x1: number;
    y1: number;
    x2: number | null;
    y2: number | null;
    swapTime: number | null; // Duración del swipe
    delay: number;
}

interface Sequence {
    sequenceId: number;
    name: string;
    steps: Step[];
}

// Tendrás que modificar AdbService para que se inyecte por medio de un Provider con el scope Transient o Request,
// o bien, modificar la inyección en CondoviveService.
// Por ahora, asumiremos que CondoviveService inyectará una instancia de AdbService ya configurada
// al constructor de SequenceExecutorService (por la estructura que ya tienes).
@Injectable()
export class SequenceExecutorService {
    private readonly logger: Logger;

    // Recibe la instancia de AdbService ya configurada para el dispositivo
    constructor(private readonly adbService: AdbService) {
        this.logger = new Logger(`SequenceExecutorService - ${this.adbService.deviceSerial}`);
    }

    /**
     * Ejecuta una secuencia de comandos ADB basada en los pasos de la base de datos.
     * @param sequence El objeto Sequence obtenido de la base de datos.
     */
    public async executeSequence(sequence: Sequence): Promise<void> {
        this.logger.log(`[EXEC] Iniciando secuencia: ${sequence.name}`);

        for (const step of sequence.steps.sort((a, b) => a.order - b.order)) {
            switch (step.type) {
                case 1: // Tap
                    this.logger.debug(`[STEP ${step.order}] Tap en (${step.x1}, ${step.y1})`);
                    await this.adbService.tap(step.x1, step.y1);
                    break;
                case 2: // Swipe
                    this.logger.debug(`[STEP ${step.order}] Swipe de (${step.x1}, ${step.y1}) a (${step.x2}, ${step.y2}) con duración ${step.swapTime}`);
                    await this.adbService.swipe(step.x1, step.y1, step.x2, step.y2, step.swapTime);
                    break;
                default:
                    this.logger.warn(`[STEP ${step.order}] Tipo de paso desconocido: ${step.type}`);
                    break;
            }

            if (step.delay && step.delay > 0) {
                await this.adbService.delay(step.delay);
            }
        }

        this.logger.log(`[EXEC] Secuencia ${sequence.name} finalizada.`);
    }
}