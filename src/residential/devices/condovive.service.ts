import { Injectable, Logger } from '@nestjs/common';
import { AdbService } from './adb.service';

type CameraState = 'expired' | 'valid' | 'unknown';

@Injectable()
export class CondoviveService {
    private readonly logger: Logger;
    private firstStart = true;
    public running = true;

    constructor(private readonly adbService: AdbService) {
        this.logger = new Logger(`CondoviveService - ${this.adbService.deviceSerial}`);
    }

    public async runAutomationLoop() {
        this.adbService.startListeningForCameraEvents();
        await this.initApp()
        while (this.running) {
            if (this.firstStart) {
                this.logger.log('[LOOP] Navegando a cámara...');
                await this.goToCamera();
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
                await this.aceptarVisita();
            } else if (estado === 'expired') {
                this.logger.log('[LOOP] ⚠️ Secuencia Denegar (QR caducado)');
                await this.denegarVisita();
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

    /** Lógica de negocio para las acciones en el dispositivo */
    public async goToCamera() {
        await this.adbService.tap(60, 110);    // Menú
        await this.adbService.delay(3000);
        await this.adbService.tap(110, 940);    // Visitas
        await this.adbService.delay(3000);
        await this.adbService.tap(200, 350);  // Escáner QR
        await this.adbService.delay(3000);
        await this.adbService.tap(360, 290);  // Frontal cam
        await this.adbService.delay(5000);
    }

    private async aceptarVisita() {
        await this.adbService.swipe(300, 650, 300, 0, 100);
        await this.adbService.delay(1000);
        await this.adbService.tap(530, 1430);
        await this.adbService.delay(3000);
        await this.adbService.tap(375, 1015);
        await this.adbService.delay(2000);
        await this.adbService.tap(200, 350); // Escáner QR shortpath
        await this.adbService.delay(2000);
        await this.adbService.tap(360, 290); // Frontal cam
    }

    private async denegarVisita() {
        await this.adbService.tap(360, 825);
        await this.adbService.delay(1000);
        await this.adbService.swipe(300, 650, 300, 0, 100);
        await this.adbService.delay(1000);
        await this.adbService.tap(190, 1430);
        await this.adbService.delay(1000);
        await this.adbService.tap(520, 1025);
        await this.adbService.delay(3000);
        await this.adbService.tap(350, 1020);
        await this.adbService.delay(2000);
        await this.adbService.tap(200, 350); // Escáner QR shortpath
        await this.adbService.delay(2000);
        await this.adbService.tap(360, 290); // Frontal cam
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
        console.log('[INIT] 🟢 Condovive iniciado');

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
        this.logger.log('[STOP] Proceso de detención de apps finalizado.');
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
