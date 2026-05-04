import { Logger } from "@nestjs/common/services";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { spawnSync } from "child_process";
import { Repository } from "typeorm";
import { Device } from "../a.entities/dev_device.entity";
import { GpioService } from "./application/gpio.service";


import { DeviceThermalLog } from "../a.entities/dev_thermal_log.entity";
import { AutomationService } from "./application/automation.service";
import { RECOVERY_FLAG } from "../../config/constants";


export class DevicesSchedule {
    private readonly logger = new Logger(DevicesSchedule.name);

    constructor(
        @InjectRepository(Device)
        private readonly devRepo: Repository<Device>,
        @InjectRepository(DeviceThermalLog)
        private thermalRepo: Repository<DeviceThermalLog>,

        private readonly gpioService: GpioService,
        private configService: ConfigService,
        private readonly automationService: AutomationService,
    ) { }

    @Cron('0 */5 * * * *') //0 */1 * * * *
    async monitorDevices() {
        const devices = await this.devRepo.find();

        for (const device of devices) {
            try {
                // 1. Verificación rápida (ping al dispositivo)
                const isAlive = spawnSync('adb', ['-s', device.adbDevice, 'shell', 'echo', '1'], { encoding: 'utf8', timeout: 2000 });

                if (isAlive.status !== 0 && this.configService.get<string>(RECOVERY_FLAG)) {
                    this.logger.warn(`Dispositivo ${device.adbDevice} offline. Recovery iniciado...`);
                    await this.automationService.recoverOffline(device.adbDevice);

                }


                const thermalResult = spawnSync('adb', ['-s', device.adbDevice, 'shell', 'dumpsys', 'thermalservice'], { encoding: 'utf8' });
                const batteryResult = spawnSync('adb', ['-s', device.adbDevice, 'shell', 'dumpsys', 'battery'], { encoding: 'utf8' });

                if (thermalResult.stdout && batteryResult.stdout) {
                    // Parseamos ambos
                    const thermalData = this.parseThermalData(thermalResult.stdout);
                    const batteryData = this.parseBatteryData(batteryResult.stdout);

                    // Unificamos en la entidad
                    const newLog = this.thermalRepo.create({
                        device_id: device.adbDevice.toString(),
                        ...thermalData, // cpu, gpu, etc.
                        battery_level: batteryData.level,
                        battery_status: batteryData.status,
                        // Opcional: El dumpsys battery también trae temperatura (ej: 254 = 25.4°C)
                        // podrías usarlo si el thermalService falla
                    });

                    await this.thermalRepo.save(newLog);
                    //this.logger.log(`📊 Reporte completo [${device.adbDevice}]: CPU: ${newLog.cpu}°C | Bat: ${newLog.battery_level}%`);
                }
            } catch (err: any) {
                this.logger.error(`Fallo crítico en device ${device.adbDevice}: ${err.message}`);
            }
        }
    }



    //#region HelperFunctions
    private parseThermalData(stdout: string): Partial<DeviceThermalLog> {
        const log: Partial<DeviceThermalLog> = {};

        // Buscamos las líneas de "Current temperatures from HAL" que son las más recientes
        // Usamos una regex global para encontrar todos los bloques de Temperature{...}
        const tempRegex = /Temperature{mValue=([\d.]+), mType=(\d+), mName=([^,]+)/g;
        let match;

        while ((match = tempRegex.exec(stdout)) !== null) {
            const value = parseFloat(match[1]);
            const type = parseInt(match[2]);

            // Mapeo según el estándar de Android (HardwarePropertiesManager)
            switch (type) {
                case 0: log.cpu = value; break;
                case 1: log.gpu = value; break;
                case 2: log.battery = value; break;
                case 3: log.skin = value; break;
                // Otros tipos pueden variar según el fabricante
            }
        }
        return log;
    }

    private parseBatteryData(stdout: string): { level?: number, status?: number } {
        const levelMatch = stdout.match(/level:\s+(\d+)/);
        const statusMatch = stdout.match(/status:\s+(\d+)/);

        return {
            level: levelMatch ? parseInt(levelMatch[1]) : undefined,
            status: statusMatch ? parseInt(statusMatch[1]) : undefined
        };
    }

    //#endregion
}
