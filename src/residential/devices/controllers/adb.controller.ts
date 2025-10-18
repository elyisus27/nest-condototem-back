import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AdbService } from '../application/adb.service';



@Controller('adb')
export class AdbController {
  constructor(private readonly adbService: AdbService) {}

  @Get(':serial/screenshot')
  async getDeviceScreenshot(@Param('serial') serial: string): Promise<string> {
    const screenshot = await this.adbService.takeScreenshot(serial);
    if (!screenshot) throw new NotFoundException(`No se pudo obtener screenshot para ${serial}`);
    return screenshot;
  }
}
