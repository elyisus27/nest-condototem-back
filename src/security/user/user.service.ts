import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';


import { DataSource } from 'typeorm';
import { SecProfile } from '../profile/entities/profile.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SecUser } from './entities/user.entity';
import { MessageDto } from '../../globals/message.dto';

@Injectable()
export class UserService {
  constructor(
    private ds: DataSource,
  ) { }


  async create(createUserDto: CreateUserDto) {

    const { username, email } = createUserDto;
    const repo = this.ds.getRepository<SecUser>(SecUser);
    const exists = await repo.findOne({ where: [{ username: username }, { email: email }], })
    if (exists) throw new BadRequestException(new MessageDto('ese usuario ya existe'));
    const user = this.ds.getRepository<SecUser>(SecUser).create(createUserDto);
    await this.ds.getRepository<SecUser>(SecUser).save(user)
    return new MessageDto('usuario creado');

  }

  async findAll() {
    const repousers = this.ds.getRepository<SecUser>(SecUser)

    const users = await repousers.find(); //Funciona pero no le sacamos jugo a las relaciones

    //Region una query con joins
    // const queryBuilder = repousers.createQueryBuilder('u')
    //   .innerJoinAndSelect('u.userProfiles', 'userProfiles')
    //   .innerJoinAndSelect('userProfiles.profile', 'profile')
    // const users = await queryBuilder.getMany();
    //endRegion

    //#region test query con joins and selects
    // const queryBuilder = repousers.createQueryBuilder('u')
    //   .innerJoinAndSelect('u.userProfiles', 'userProfiles')
    //   .innerJoinAndSelect('userProfiles.profile', 'profile')
    //   .select('u.firstName', 'firstName') //ya en esta version no hay que escribir aliases, para que lo instancie a la entidad? o como ? 
    //   .addSelect('u.lastName', 'lastName')
    //   .addSelect('u.password', 'password')
    //   .addSelect('profile.profileName', 'profileName')
    // let users = await queryBuilder.getRawMany();
    //#endregion

    //#region test tree
    //const treeCategories = await dataSource.manager.getTreeRepository(Category).findTrees()
    //const users = await repousers.manager.getTreeRepository(SecUser).findTrees();


    if (!users) throw new NotFoundException(new MessageDto('no hay usuarios en la lista'))
    return users

  }




  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
