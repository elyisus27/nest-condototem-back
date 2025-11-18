import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../a.entities/dev_device.entity';


@Injectable()
export class GpioService implements OnModuleInit { 

    private readonly logger = new Logger(GpioService.name);
    private gpio: any;
    private isHardwareAvailable: boolean = false;

    // El constructor SÓLO maneja la inyección de dependencias
    constructor(
        @InjectRepository(Device)
        private readonly devRepo: Repository<Device>,
    ) {   }


    async onModuleInit() {
        try {

             this.logger.warn(`Arquitectura detectada: ${process.arch}`);            
            if (process.arch.startsWith('arm')) {
                // Lógica síncrona (require)
                this.gpio = require('onoff').Gpio;
                this.isHardwareAvailable = true;
                this.logger.log('GPIO hardware disponible (modo ARM)');

                // Lógica ASÍNCRONA: usa await para obtener los datos
                let devices = await this.devRepo.find({ where: { tagEnabled: 1 } });

                // Ahora puedes iterar y usar 'devices'
                for (const dev of devices) {
                    this.logger.log(`Inicializando dispositivo: ${dev.deviceName} en PIN ${dev.gpioPin}`);
                    const output = new this.gpio(dev.gpioPin, 'out');
                    output.writeSync(1); 
                    
                }

            } else {
                this.logger.warn('GPIO no disponible: simulando (modo Windows)');
            }
        } catch (err) {
            this.logger.warn(`No se pudo inicializar GPIO: simulando. Error: ${err.message}`);
        }
    }

    async pulse(pin: number, durationMs: number) {
        if (!pin) {
            this.logger.warn('No se especificó pin GPIO');
            return;
        }

        if (this.isHardwareAvailable && this.gpio) {
            const output = new this.gpio(pin, 'out');
            output.writeSync(0);
            await new Promise(r => setTimeout(r, durationMs));
            output.writeSync(1);
            output.unexport();
            this.logger.log(`Pulso GPIO ${pin} durante ${durationMs} ms`);
        } else {
            this.logger.log(`[Simulación] Pulso GPIO ${pin} (${durationMs} ms)`);
        }
    }
}


