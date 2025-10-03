import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { SecProfile } from './entities/profile.entity';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SecProfile,])],
  controllers: [ProfileController],
  providers: [ProfileService]
})
export class ProfileModule { }
