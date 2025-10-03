import { Controller, Get, Post, Body, Patch, Param, Delete, ParseBoolPipe, ParseIntPipe, Query } from '@nestjs/common';
import { HouseService } from './house.service';
// import { CreateHouseDto } from './dto/create-house.dto';
// import { UpdateHouseDto } from './dto/update-house.dto';
import { TableFiltersDto } from '../../globals/tableFilters.dto';

@Controller('house')
export class HouseController {
  constructor(private readonly houseService: HouseService) {}

  // @Post()
  // create(@Body() createHouseDto: CreateHouseDto) {
  //   return this.houseService.create(createHouseDto);
  // }

  @Get()
  findAll() {
    return this.houseService.findAll();
  }

  @Get('listPaginated')
  listPaginatedWpfTest(
    //all Get Requests whom receive query params are supposed to use nestjscommon parse pipes, 
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('searchtxt',) searchtxt: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('showInactives', ParseBoolPipe) showInactives: boolean,) {

    //console.log('dates rec', start, end)
    const filters: TableFiltersDto = {
      page: page,
      limit: limit,
      searchtxt: searchtxt,
      start: new Date(`${start}T00:00:00.000-06:00`),//Aproach1 
      end: new Date(`${end}T23:59:59.0000-06:00`),//Approach1 
      //start: new Date(`${start}T00:00:00.000Z`), //Appr2
      //end: new Date(`${end}T23:59:59.000Z`), //Appr2
      showInactives: showInactives
    }
    //console.log('ya con datatype', filters)

    return this.houseService.listPaginated(filters)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.houseService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateHouseDto: UpdateHouseDto) {
  //   return this.houseService.update(+id, updateHouseDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.houseService.remove(+id);
  }
}
