import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DATABASE_SYNC, DB_NAME, DB_HOST, DB_PASS, DB_PORT, DB_TYPE, DB_USER } from './config/constants';
import { UserModule } from './security/user/user.module';
import { ProfileModule } from './security/profile/profile.module';
import { UserProfileModule } from './security/user_profile/user_profile.module';
import { MySQLInsertTablesService } from './globals/mysql.schedule';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './security/auth/auth.module';

import { DevicesModule } from './residential/devices/devices.module';
import { AutomationSchedule } from './globals/automation.schedule';



@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<any>(DB_TYPE),
        timezone :'Z',
        host: configService.get<string>(DB_HOST),
        port: +configService.get<number>(DB_PORT),
        username: configService.get<string>(DB_USER),
        password: configService.get<string>(DB_PASS),
        database: configService.get<string>(DB_NAME),
        entities: [__dirname + '/**/*.entity.{js,ts}'],
        synchronize: configService.get<string>(DATABASE_SYNC) == '1',
        logging: false
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),

    UserModule,
    ProfileModule,
    UserProfileModule,
    AuthModule,

    DevicesModule,

    

  ],
  controllers: [AppController],
  providers: [AppService, MySQLInsertTablesService, AutomationSchedule],
})
export class AppModule { }
