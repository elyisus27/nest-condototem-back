// import { Controller, Post, Param, Delete, Logger } from '@nestjs/common';
// import { AutomationService } from '../application/automation.service';

// @Controller('automation')
// export class AutomationController {
//   private readonly logger = new Logger(AutomationController.name);

//   constructor(private readonly automationService: AutomationService) {}

//   @Post('initialize')
//   async initializeAll() {
//     this.logger.log('Inicializando servicios Condovive para todos los dispositivos activos...');
//     return await this.automationService.initializeServices();
//   }

//   @Post(':deviceId/start')
//   async startCycle(@Param('deviceId') deviceId: string) {
//     return await this.automationService.startCycle(+deviceId);
//   }

//   @Delete(':deviceId/stop')
//   async stopCycle(@Param('deviceId') deviceId: string) {
//     return await this.automationService.stopCycle(+deviceId);
//   }
// }
