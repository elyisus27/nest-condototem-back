import { PayloadInterface } from './../payload.interface';

import { JWT_SECRET } from '../../../config/constants';
import { ConfigService } from '@nestjs/config';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SecUser } from '../../../security/user/entities/user.entity';
import { MessageDto } from '../../../globals/message.dto';
import { DataSource, Repository } from 'typeorm';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        @InjectRepository(SecUser)
        private readonly authRepo: Repository<SecUser>,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get(JWT_SECRET)
        });
    }

    async validate(payload: PayloadInterface) {
        const { username, email } = payload;

        const usuario = await this.authRepo.findOne({ where: [{ username: username }, { email: email }] });
        //console.log(usuario)
        if (!usuario) return new UnauthorizedException(new MessageDto('credenciales erróneas'));
        return payload;
    }
}