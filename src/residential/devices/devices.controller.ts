import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, ParseBoolPipe, Logger, NotFoundException, HttpCode, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';

import { CreateDeviceDto } from './dto/create-device.dto';
import { TableFiltersDto } from '../../globals/tableFilters.dto';
import { ResponseGeneric } from '../../globals/reponse.class';
import { DevicesService } from './application/devices.service';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);
  constructor(private readonly deviceService: DevicesService) { }

  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @Get('listPaginated')
  listPaginated(@Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('searchtxt',) searchtxt: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('showInactives', ParseBoolPipe) showInactives: boolean,) {

    const filters: TableFiltersDto = {
      page: page,
      limit: limit,
      searchtxt: searchtxt,
      start: new Date(`${start}T00:00:00.000-06:00`),
      end: new Date(`${end}T23:59:59.0000-06:00`),
      showInactives: showInactives
    }

    return this.deviceService.listPaginated(filters)
  }

  @Post('close-all-apps/:adbSerial')
  async closeAllApps(@Param('adbSerial') adbSerial: string) {
    this.logger.log(`Request to close all apps on device ${adbSerial}`);
    try {
      await this.deviceService.closeAllApps(adbSerial);
      return { success: true, message: `All apps closed on device ${adbSerial}` };
    } catch (error) {
      this.logger.error(`Failed to close apps on ${adbSerial}: ${error.message}`);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/restart-services/:adbSerial')
  async restartServices(@Param('adbSerial') adbSerial: string) {
    this.logger.log(`Request to restart services on device ${adbSerial}`);
    await this.deviceService.restartServices(adbSerial);
    return { success: true, message: `Services restarted on device ${adbSerial}` };
  }

  @Post('/stop-services/:adbSerial')
  async stopServices(@Param('adbSerial') adbSerial: string) {
    this.logger.log(`Request to stop services on device ${adbSerial}`);
    await this.deviceService.stopServices(adbSerial);
    return { success: true, message: `Services stopped on device ${adbSerial}` };
  }

  @Post('start-services/:adbSerial/')
  async startServices(@Param('adbSerial') adbSerial: string) {
    this.logger.log(`Request to start services on device ${adbSerial}`);
    await this.deviceService.startServices(adbSerial);
    return { success: true, message: `Services started on device ${adbSerial}` };
  }

  @Get('screenshot/:adbSerial')
  async getScreenshot(@Param('adbSerial') adbSerial: string): Promise<any> {
    try {

      const screenshotData = await this.deviceService.getDeviceScreenshot(adbSerial);
      if (!screenshotData) {
        throw new NotFoundException(`No se encontró un servicio para el dispositivo: ${adbSerial}`);
      }
      return { success: true, data: screenshotData };
    } catch (error) {
      this.logger.error(`Error al obtener la captura de pantalla para ${adbSerial}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('gpio/:adbSerial')
  async writeGpio(@Param('adbSerial') adbSerial: string): Promise<any> {
    try {

      const screenshotData = await this.deviceService.writegpio(adbSerial);
      // if (!screenshotData) {
      //   throw new NotFoundException(`No se encontró un servicio para el dispositivo: ${adbSerial}`);
      // }
      return { success: true, data: screenshotData };
    } catch (error) {
      this.logger.error(`Error al escribir io. ${adbSerial}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('save')
  addOrUpdate(@Body() updateClientDto: CreateDeviceDto) {
    return this.deviceService.save(updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(+id);
  }
}
