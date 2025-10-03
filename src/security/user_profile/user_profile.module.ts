import { Module } from '@nestjs/common';
import { UserProfileService } from './user_profile.service';
import { UserProfileController } from './user_profile.controller';

@Module({
  controllers: [UserProfileController],
  providers: [UserProfileService]
})
export class UserProfileModule {}
