import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreateHouseDto } from './dto/create-house.dto';
// import { UpdateHouseDto } from './dto/update-house.dto';
import { Between, DataSource, Like, MoreThanOrEqual, Repository } from 'typeorm';
//import { ResHouse } from './entities/house.entity';

import { TableFiltersDto } from '../../globals/tableFilters.dto';
import { InjectRepository } from '@nestjs/typeorm';

import { MessageDto } from '../../globals/message.dto';
import { ResHouse } from '../a.entities/house.entity';
import { Devices } from '../a.entities/devices.entity';

@Injectable()
export class HouseService {
  constructor(
    private ds: DataSource,
    @InjectRepository(Devices)
    private clientRepo: Repository<Devices>,
  ) { }

  // create(createHouseDto: CreateHouseDto) {
  //   return 'This action adds a new house';
  // }

  async findAll() {
    const repoHouse = this.ds.getRepository<ResHouse>(ResHouse)
    // const houses = await repoHouse.find();

    try {
      const queryBuilder = repoHouse.createQueryBuilder('h')
        .innerJoinAndSelect('h.clients', 'clients')
        .select('h.houseId', 'houseId')
        .addSelect('h.street', 'street')
        .addSelect('h.exteriorNumber', 'exteriorNumber')
        .addSelect('clients.lastName', 'lastName')
        .addSelect('clients.motherLastName', 'motherLastName')
        .addSelect('clients.firstName', 'firstName')
        .addSelect('h.debtor', 'debtor')

      let houses = await queryBuilder.getRawMany();
      if (!houses) throw new NotFoundException(new MessageDto('lista vacía'))
      return houses
    } catch (error) {
      console.log(error)
      throw new NotFoundException(new MessageDto(error.message))
    }
  }

  async listPaginated(filters: TableFiltersDto) {
    
    //where col1=value1 and col2=vlaue2 or col3=value3 or col4=value4
    //[{prop1:'value1', prop2:'value2'}, {prop2:'value3'}]    inside objects are ands. array objects are ors
    //ands must repeat at every object, ors are separated by objects
    let tagActivefilter = filters.showInactives == true ? 0 : 1;

    const SKIP = filters.limit * (filters.page - 1);
    // const list = await this.saleRepo.findAndCount({
    //   skip: SKIP,
    //   take: filters.limit,
    //   where: [{
    //     loadingDate: Between(filters.start, filters.end), //and
    //     tagActive: MoreThanOrEqual(tagActivefilter),//and
    //     comments: Like(`%${filters.searchtxt}%`) ,//and
    //   },//or
    //   {
    //     loadingDate: Between(filters.start, filters.end),
    //     tagActive: MoreThanOrEqual(tagActivefilter),
    //     clientName: Like(`%${filters.searchtxt}%`),

    //   },
    //   ],
    // })


    //testeando forma query 
    const queryBuilder = this.clientRepo.createQueryBuilder('q')
      .skip( SKIP)
      .take( filters.limit)
      .where(
        [{
          //loadingDate: Between(filters.start, filters.end), //and
          tagActive: MoreThanOrEqual(tagActivefilter),//and
          //comments: Like(`%${filters.searchtxt}%`) ,//and
        },//or
        {
          //loadingDate: Between(filters.start, filters.end),
          tagActive: MoreThanOrEqual(tagActivefilter),
          //clientName: Like(`%${filters.searchtxt}%`),
  
        },
        ],
        )
      
    const list = await queryBuilder.getManyAndCount();
    //end testeando forma query

    //console.log('leidos', list[0])
    return { success: true, data: { items: list[0], totalItems: list[1] } };

  }

  findOne(id: number) {
    return `This action returns a #${id} house`;
  }

  // update(id: number, updateHouseDto: UpdateHouseDto) {
  //   return `This action updates a #${id} house`;
  // }

  remove(id: number) {
    return `This action removes a #${id} house`;
  }
}
