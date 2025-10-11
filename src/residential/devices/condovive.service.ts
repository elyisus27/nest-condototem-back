import { Injectable, Logger } from '@nestjs/common';
import { AdbService } from './adb.service';
import { SequenceExecutorService } from './sequence-executor.service';
import { Device } from '../a.entities/dev_device.entity';
import { Sequence } from '../a.entities/dev_sequence.entity';

type CameraState = 'expired' | 'valid' | 'unknown';

@Injectable()
export class CondoviveService {
    private readonly logger: Logger;
    private firstStart = true;
    public running = true;
    private readonly deviceData: Device; // Almacenamos los datos del dispositivo

    private readonly sequenceExecutor: SequenceExecutorService;

    constructor(private readonly adbService: AdbService, deviceData: Device,) {
        this.deviceData = deviceData;
        this.logger = new Logger(`CondoviveService - ${this.adbService.deviceSerial}`);
        this.sequenceExecutor = new SequenceExecutorService(this.adbService);
    }

    public async runAutomationLoop() {
        this.adbService.startListeningForCameraEvents();
        await this.initApp()
        while (this.running) {
            if (this.firstStart) {
                this.logger.log('[LOOP] Navegando a cámara...');
                await this.executeGoToCamera();
                this.firstStart = false;
            }

            this.logger.log('[LOOP] Estado idle, esperando evento de cámara...');

            const estado = await new Promise<CameraState>((resolve) => {
                this.adbService.cameraEvent.once('cameraClosed', (state: CameraState) => {
                    resolve(state);
                });
            });

            if (!this.running) break;

            if (estado === 'valid') {
                this.logger.log('[LOOP] ✅ Secuencia Aceptar Visita');
                await this.executeAceptarVisita();
            } else if (estado === 'expired') {
                this.logger.log('[LOOP] ⚠️ Secuencia Denegar (QR caducado)');
                await this.executeDenegarVisita();
            } else {
                this.logger.warn('[LOOP] 🤷 Pantalla desconocida. Volviendo a QR...');
            }

            // Esperar un momento antes de reiniciar el bucle
            await this.adbService.delay(2000);
            this.logger.log('[LOOP] Regresando al lector QR...');
            await this.adbService.tap(100, 200); // Toca para volver a la pantalla de QR
        }
    }

    public stop() {
        this.running = false;
        this.logger.log('[STOP] 🔴 Automatización detenida');
    }

    public stopListening(){
        this.adbService.stopListening()
    }

    /** Lógica de negocio para las acciones en el dispositivo */
    // Método auxiliar para obtener una secuencia por nombre
    private getSequenceByName(name: string): Sequence | undefined {
        return this.deviceData.sequences.find(s => s.name.toLowerCase() === name.toLowerCase());
    }

    // La lógica de negocio ahora llama al ejecutor de secuencias con los datos de la DB
    private async executeGoToCamera(): Promise<void> {
        const sequence = this.getSequenceByName('GoToCamera');
        if (sequence) {
            await this.sequenceExecutor.executeSequence(sequence as any); // Usar `as any` si la interfaz no coincide exactamente
        } else {
            this.logger.error('Secuencia "GoToCamera" no encontrada en la DB.');
            // Manejo de error: ¿detener el bucle, lanzar excepción, etc.?
        }
    }

    private async executeAceptarVisita(): Promise<void> {
        const sequence = this.getSequenceByName('Aceptar Visita');
        if (sequence) {
            await this.sequenceExecutor.executeSequence(sequence as any);
        } else {
            this.logger.error('Secuencia "Aceptar Visita" no encontrada en la DB.');
        }
    }

    private async executeDenegarVisita(): Promise<void> {
        const sequence = this.getSequenceByName('Denegar Visita');
        if (sequence) {
            await this.sequenceExecutor.executeSequence(sequence as any);
        } else {
            this.logger.error('Secuencia "Denegar Visita" no encontrada en la DB.');
        }
    }

    public async initApp() {
        //console.log('[INIT] Cerrando app...');

        await this.adbService.runAdb(['shell', 'am', 'force-stop', 'com.condovive.guard']);
        await this.adbService.delay(1000);

        //console.log('[INIT] Limpiando logcat...');
        await this.adbService.runAdb(['logcat', '-c']);
        await this.adbService.delay(1000);
        await this.adbService.runAdb(['shell', 'monkey', '-p', 'com.condovive.guard', '-c', 'android.intent.category.LAUNCHER', '1']);
        await this.adbService.delay(10000)
        //console.log('[INIT] 🟢 Condovive iniciado');

    }
    public async forceStopApp(): Promise<void> {
        this.logger.log('[STOP] Solicitud para detener la app.');
        this.running = false;
        await this.adbService.forceStopApp();
    }

    public async forceStopAllApps(): Promise<void> {
        this.logger.log('[STOP] Solicitud para detener todas las aplicaciones.');
        this.running = false; // Opcional: si quieres detener el bucle de automatización
        await this.adbService.forceStopAllApps();
    }

    public async closeAllApps(): Promise<void> {
        this.running = false;

        //await this.adbService.swipe(320, 1580, 320, 50, 1000);
        await this.adbService.closeAllApps();
    }

    public async getDeviceScreenshot(): Promise<string> {
        return this.adbService.takeScreenshot();
    }



}
