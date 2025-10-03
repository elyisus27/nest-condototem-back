import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MessageDto } from '../../globals/message.dto';
import { DataSource } from 'typeorm';
import { SecUser } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { compare } from 'bcryptjs';
import { PayloadInterface } from './payload.interface';
import { JwtService } from '@nestjs/jwt';
import { SecUserProfile } from '../user_profile/entities/user_profile.entity';
import { USERWHITESPACABLE_TYPES } from '@babel/types';
//import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private ds: DataSource,
    private readonly jwtService: JwtService
  ) { }
  async login(loginDto: LoginDto): Promise<any> {
    const userRepo = this.ds.getRepository<SecUser>(SecUser);
    const { username } = loginDto;

    const queryBuilder = userRepo.createQueryBuilder('u')
      .innerJoinAndSelect('u.userProfiles', 'userProfiles')
      .innerJoinAndSelect('userProfiles.profile', 'profile')
      .where([{ username: username }, { email: username }])
    const user = await queryBuilder.getOne();

    if (!user) throw new UnauthorizedException(new MessageDto('no existe el usuario'));
    const passwordOK = await compare(loginDto.password, user.password);
    if (!passwordOK) throw new UnauthorizedException(new MessageDto('contraseña errónea'));

    
    const payload: PayloadInterface = {
      id: user.userId,
      username: user.username,
      email: user.email,
      profiles: user.userProfiles.map((rol: SecUserProfile) => {
        return (rol.profile).profileName;
      })
    };


    const token = await this.jwtService.sign(payload);


    return {
      success: true, data: { token: token }
    };
  }

  // findAll() {
  //   return `This action returns all auth`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }
}
