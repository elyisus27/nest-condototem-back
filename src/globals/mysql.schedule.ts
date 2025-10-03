import { Injectable, Logger } from '@nestjs/common';
// import { NestSchedule, Timeout } from 'nest-schedule';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SecProfile } from '../security/profile/entities/profile.entity';
import { SecUserProfile } from '../security/user_profile/entities/user_profile.entity';
import { SecUser } from '../security/user/entities/user.entity';
import { CreateUserDto } from '../security/user/dto/create-user.dto';
import { Console } from 'console';
import { hash } from 'bcryptjs';
import { Cron, Timeout } from '@nestjs/schedule';
import { Devices } from '../residential/a.entities/devices.entity';
import { CreateDeviceDto } from '../residential/devices/dto/create-device.dto';



@Injectable()
export class MySQLInsertTablesService {
    private readonly logger = new Logger('MySQL - Schedule');
    constructor(

        private config: ConfigService,
        private ds: DataSource
    ) { }

    @Timeout(5000)
    handleTimeout() {
        this.handleCreateProfile()
    }


    async handleCreateProfile() {
        //Profile, users and userprofile

        try {

            const repo = this.ds.getRepository<SecProfile>(SecProfile)
            const data = await repo.find();

            if (data.length == 0 || this.config.get('DATABASE_SYNC') == '2') {
                const PROFILES: SecProfile[] = [{ profileId: 1, profileName: 'ADMIN-PROFILE' }, { profileId: 2, profileName: 'USER-PROFILE' }, { profileId: 3, profileName: 'GUARD-PROFILE' }]
                repo.save(PROFILES);
                this.logger.log('Generación de data correcta [SecProfile]');

            }
        } catch (err) {
            this.logger.error(`[SecProfile] - ${err}` || 'Error al generar los datos [SecProfile]');
        }

        this.handleCreateUser();
    }

    async handleCreateUser() {
        try {

            const repo = this.ds.getRepository<SecUser>(SecUser);
            const repoProfile = this.ds.getRepository<SecUserProfile>(SecUserProfile);

            const data = await repo.find();
            if (data.length == 0 || this.config.get('DATABASE_SYNC') == '2') {

                //AdminUser
                const adminDto: CreateUserDto = {
                    //userId: 1,
                    username: 'admin',
                    password: 'AdminPass.', //Initial Temporary password
                    firstName: 'Administrador',
                    lastName: 'Administrador',
                    email: 'admin@yoursite.com',
                };
                //NormalUser
                const userDto: CreateUserDto = {
                    //userId: 2,
                    username: 'user',
                    password: 'UserPass.', //Initial Temporary password
                    firstName: 'Usuario',
                    lastName: 'Usuario',
                    email: 'user@yoursite.com',
                }
                //SecurityGuard User
                const guardDto: CreateUserDto = {
                    //userId: 3,
                    username: 'guardia',
                    password: 'GuardiaReservaPase.!', //Initial Temporary password
                    firstName: 'Guardia',
                    lastName: 'Reserva',
                    email: 'guardiaReserva@yoursite.com',
                }
                const admin = await repo.create(adminDto);
                const user = await repo.create(userDto);
                const guard = await repo.create(guardDto);

                const saved = await repo.save([admin, user, guard]);

                const userProfiles: SecUserProfile[] = [
                    {
                        userProfileId: 1,
                        userId: 1,
                        profileId: 1
                    }, {
                        userProfileId: 2,
                        userId: 1,
                        profileId: 2
                    }, {
                        userProfileId: 3,
                        userId: 2,
                        profileId: 2
                    },
                    {
                        userProfileId: 4,
                        userId: 3,
                        profileId: 3
                    }
                ]
                const savedUserProfiles = await repoProfile.save(userProfiles)
                this.logger.log('Generación de data correcta [SecUser]');


            }
        } catch (err) {
            this.logger.error(`[SecUser] - ${err}` || 'Error al generar los datos [SecUser]');
        }


    }

    async handleCreateDevices() {

        const repo = this.ds.getRepository<Devices>(Devices)
        const data = await repo.find();

        if (data.length == 0 || this.config.get('DATABASE_SYNC') == '2') {

            try {
                const repo = this.ds.getRepository<Devices>(Devices)

                const dtos: CreateDeviceDto[] = [
                    {
                        deviceName: "Puerta Peatonal 1",
                        description: "Puerta Peatonal 1",
                        adb_device: "NO ASIGNADO"
                    }, {
                        deviceName: "Puerta Peatonal 2",
                        description: "Puerta Peatonal 2",
                        adb_device: "NO ASIGNADO"
                    }, {
                        deviceName: "Puerta Vehicular entrada",
                        description: "Puerta Vehicular entrada",
                        adb_device: "NO ASIGNADO"
                    }, {
                        deviceName: "Puerta Vehicular salida",
                        description: "Puerta Vehicular salida",
                        adb_device: "NO ASIGNADO"
                    },


                ]
                const saved = repo.save(dtos)
                this.logger.log('Generación de data correcta [Devices]');

            } catch (err) {

            }
        }
    }


}