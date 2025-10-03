import { Module } from '@nestjs/common';
import { HouseService } from './house.service';
import { HouseController } from './house.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ResHouse } from './entities/house.entity';
// import { ResClient } from '../client/entities/client.entity';

@Module({
  //imports: [TypeOrmModule.forFeature([ResHouse, ResClient])],
  controllers: [HouseController],
  providers: [HouseService]
})
export class HouseModule {}
