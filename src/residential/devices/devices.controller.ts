import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, ParseBoolPipe, Logger, NotFoundException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { TableFiltersDto } from '../../globals/tableFilters.dto';
import { ResponseGeneric } from '../../globals/reponse.class';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);
  constructor(private readonly deviceService: DevicesService) { }

  @Post()
  create(@Body() createClientDto: CreateDeviceDto) {
    return this.deviceService.create(createClientDto);
  }

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

  @Get('run-condovive/:adbSerial')
  runCondovive(@Param('adbSerial') adbSerial: string): Promise<ResponseGeneric> {
    return this.deviceService.runCondovive(adbSerial);
  }

  @Get('stop-condovive')
  stopCondovive(): Promise<ResponseGeneric> {
    return this.deviceService.stopCondovive();
  }

  @Get('force-stop/:adbSerial')
  async forceStopApp(@Param('adbSerial') adbSerial: string): Promise<any> {
    try {
      this.logger.log(`Solicitando detener la app en el dispositivo: ${adbSerial}`);
      await this.deviceService.forceStopApp(adbSerial);
      return { success: true, message: 'La aplicación ha sido detenida.' };
    } catch (error) {
      this.logger.error(`Error al detener la app en ${adbSerial}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Get('force-stop-all/:adbSerial')
  async forceStopAllApps(@Param('adbSerial') adbSerial: string): Promise<any> {
    try {
      this.logger.log(`Solicitando detener todas las apps en el dispositivo: ${adbSerial}`);
      await this.deviceService.forceStopAllApps(adbSerial);
      return { success: true, message: 'Se ha iniciado el proceso para detener todas las aplicaciones.' };
    } catch (error) {
      this.logger.error(`Error al detener todas las apps en ${adbSerial}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Get('close-all-apps/:adbSerial')
  async closeAllApps(@Param('adbSerial') adbSerial: string): Promise<any> {
    try {
      
      await this.deviceService.closeAllApps(adbSerial);
      return { success: true, message: 'El proceso de cierre de aplicaciones ha sido iniciado.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
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

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.deviceService.findOne(+id);
  // }

  @Post('save')
  addOrUpdate(@Body() updateClientDto: CreateDeviceDto) {
    return this.deviceService.save(updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(+id);
  }
}
