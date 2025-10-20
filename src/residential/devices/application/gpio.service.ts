import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GpioService {
    private logger = new Logger(GpioService.name);
    private isHardwareAvailable = false;
    private gpio: any;

    constructor() {
         this.logger.log(`Arquitectura detectada: ${process.arch}`);
        try {
            // Intenta requerir la librería solo si existe
            if (process.arch.startsWith('arm')) {
                this.gpio = require('onoff').Gpio;
                this.isHardwareAvailable = true;
                this.logger.log('GPIO hardware disponible (modo ARM)');
            } else {
                this.logger.warn('GPIO no disponible: simulando (modo Windows)');
            }
        } catch (err) {
            this.logger.warn('No se pudo inicializar GPIO: simulando');
        }
    }

    async pulse(pin: number, durationMs = 200) {
        if (!pin) {
            this.logger.warn('No se especificó pin GPIO');
            return;
        }

        if (this.isHardwareAvailable && this.gpio) {
            const output = new this.gpio(pin, 'out');
            output.writeSync(1);
            await new Promise(r => setTimeout(r, durationMs));
            output.writeSync(0);
            output.unexport();
            this.logger.log(`Pulso GPIO ${pin} durante ${durationMs} ms`);
        } else {
            this.logger.log(`[Simulación] Pulso GPIO ${pin} (${durationMs} ms)`);
        }
    }
}
