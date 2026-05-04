#!/bin/bash
# ============================================================
# 03_update_devices_controller.sh
# Reconecta endpoints start/stop/restart al servicio
# Ejecutar desde: ia-scripts/   (WSL)
# ============================================================

TARGET="../src/residential/devices/devices.controller.ts"

cat > "$TARGET" << 'ENDOFFILE'
// src/residential/devices/devices.controller.ts
import {
  Controller, Get, Post, Body, Param, Delete,
  Query, ParseIntPipe, ParseBoolPipe,
  Logger, HttpException, HttpStatus,
} from '@nestjs/common';

import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateThermalDto } from './dto/create-thermal.dto';
import { TableFiltersDto } from '../../globals/tableFilters.dto';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  constructor(private readonly deviceService: DevicesService) {}

  // ─── Listados ─────────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @Get('listPaginated')
  listPaginated(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('searchtxt') searchtxt: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('showInactives', ParseBoolPipe) showInactives: boolean,
  ) {
    const filters: TableFiltersDto = {
      page, limit, searchtxt,
      start: new Date(`${start}T00:00:00.000-06:00`),
      end: new Date(`${end}T23:59:59.000-06:00`),
      showInactives,
    };
    return this.deviceService.listPaginated(filters);
  }

  // ─── Control de ciclo ────────────────────────────────────────────────────────

  @Post('start-services/:adbSerial')
  async startServices(@Param('adbSerial') adbSerial: string) {
    try {
      await this.deviceService.startServices(adbSerial);
      return { success: true, message: `Ciclo iniciado para ${adbSerial}` };
    } catch (error) {
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('stop-services/:adbSerial')
  async stopServices(@Param('adbSerial') adbSerial: string) {
    try {
      await this.deviceService.stopServices(adbSerial);
      return { success: true, message: `Ciclo detenido para ${adbSerial}` };
    } catch (error) {
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('restart-services/:adbSerial')
  async restartServices(@Param('adbSerial') adbSerial: string) {
    try {
      await this.deviceService.restartServices(adbSerial);
      return { success: true, message: `Ciclo reiniciado para ${adbSerial}` };
    } catch (error) {
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ─── Screenshot ───────────────────────────────────────────────────────────────

  @Get('screenshot/:adbSerial')
  async getScreenshot(@Param('adbSerial') adbSerial: string) {
    try {
      const data = await this.deviceService.getDeviceScreenshot(adbSerial);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Screenshot error ${adbSerial}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // ─── GPIO manual ──────────────────────────────────────────────────────────────

  @Post('gpio/:adbSerial')
  async writeGpio(@Param('adbSerial') adbSerial: string) {
    try {
      await this.deviceService.writegpio(adbSerial);
      return { success: true };
    } catch (error) {
      this.logger.error(`GPIO error ${adbSerial}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  @Post('save')
  addOrUpdate(@Body() dto: CreateDeviceDto) {
    return this.deviceService.save(dto);
  }

  @Post('thermal')
  createThermal(@Body() dto: CreateThermalDto) {
    return this.deviceService.create(dto);
  }

  @Post('adb_wifi_update')
  updateAdbAddr(@Body() body: any) {
    return this.deviceService.updateAdbAddr(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(+id);
  }
}
ENDOFFILE

echo "✅ devices.controller.ts actualizado en $TARGET"
