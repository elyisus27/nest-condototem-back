import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageDto } from '../../globals/message.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SecProfile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(SecProfile)
    private repoProfile: Repository<SecProfile>,

  ) { }
  create(createProfileDto: CreateProfileDto) {
    return 'This action adds a new profile';
  }

  async findAll() {
    const profiles = await this.repoProfile.find()
    if (!profiles) throw new NotFoundException(new MessageDto('no hay perfiles en la lista'))
    return profiles

  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
