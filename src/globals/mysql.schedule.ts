import { Injectable, Logger } from '@nestjs/common';
// import { NestSchedule, Timeout } from 'nest-schedule';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SecProfile } from '../security/profile/entities/profile.entity';
import { SecUserProfile } from '../security/user_profile/entities/user_profile.entity';
import { SecUser } from '../security/user/entities/user.entity';
import { CreateUserDto } from '../security/user/dto/create-user.dto';
import { Device } from '../residential/a.entities/dev_device.entity';
import { SequenceStep } from '../residential/a.entities/dev_sequence_step.entity';
import { Sequence } from '../residential/a.entities/dev_sequence.entity';
import { Timeout } from '@nestjs/schedule';



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

        this.handleCreateDevices();
    }


    async handleCreateDevices(): Promise<void> {
        const repoDevices = this.ds.getRepository(Device);
        const data = await repoDevices.find();

        // Controla si ya hay datos o si se fuerza la sincronización
        if (data.length == 0 || this.config.get('DATABASE_SYNC') == '2') {
            // Inicia una transacción para asegurar la consistencia
            const queryRunner = this.ds.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // 1. Definir los datos de los Devices (Entidad principal)
                const deviceData = [
                    //{ deviceName: "Puerta Peatonal 1", description: "Puerta Peatonal 1", adbDevice: "R9PTA0D99SN" },
                    //{ deviceName: "Puerta Peatonal 2", description: "Puerta Peatonal 2", adbDevice: "NO ASIGNADO" },
                    { deviceName: "Puerta Vehicular entrada", description: "Puerta Vehicular entrada", adbDevice: "R9PTA0D99SN" },
                    //{ deviceName: "Puerta Vehicular salida", description: "Puerta Vehicular salida", adbDevice: "NO ASIGNADO" },
                ];

                // 2. Guardar los Devices
                const savedDevices = await queryRunner.manager.save(Device, deviceData);

                this.logger.log(`Generación de data correcta [Device]. ${savedDevices.length} Devices.`);


                // 3. Crear las Secuencias y Steps para cada Device
                const sequencesToSave: Sequence[] = [];

                //let sequenceIdCounter = 1; // Para un control manual si es necesario, aunque TypeORM lo maneja

                for (const device of savedDevices) {
                    // Secuencia GoToCamera para el Device
                    const goToCameraSteps = [
                        queryRunner.manager.create(SequenceStep, { order: 1, type: 1, x1: 60, y1: 110, delay: 3000 }),
                        queryRunner.manager.create(SequenceStep, { order: 2, type: 1, x1: 110, y1: 940, delay: 3000 }),
                        queryRunner.manager.create(SequenceStep, { order: 3, type: 1, x1: 200, y1: 350, delay: 3000 }),
                        queryRunner.manager.create(SequenceStep, { order: 4, type: 1, x1: 360, y1: 290, delay: 5000 }),
                    ];

                    const goToCameraSeq = queryRunner.manager.create(Sequence, {
                        name: 'GoToCamera',
                        device: device,
                        steps: goToCameraSteps
                    });


                    // Secuencia Aceptar para el Device
                    const AcceptSteps = [
                        queryRunner.manager.create(SequenceStep, { order: 1, type: 2, x1: 300, y1: 650, x2: 300, y2: 0, swapTime: 100, delay: 1000 }),
                        queryRunner.manager.create(SequenceStep, { order: 2, type: 1, x1: 530, y1: 1430, delay: 3000 }),
                        queryRunner.manager.create(SequenceStep, { order: 3, type: 1, x1: 375, y1: 1015, delay: 2000 }),
                        queryRunner.manager.create(SequenceStep, { order: 4, type: 1, x1: 200, y1: 350, delay: 2000 }),
                        queryRunner.manager.create(SequenceStep, { order: 5, type: 1, x1: 200, y1: 350, delay: 0 }),
                    ];
                    const acceptSeq = queryRunner.manager.create(Sequence, {
                        name: 'Aceptar Visita',
                        device: device,
                        steps: AcceptSteps,
                    });

                    // Secuencia Denegar para el Device
                    const DenegateSteps = [
                        queryRunner.manager.create(SequenceStep, { order: 1, type: 1, x1: 360, y1: 825, delay: 1000 }),
                        queryRunner.manager.create(SequenceStep, { order: 2, type: 2, x1: 300, y1: 650, x2: 300, y2: 0, swapTime: 100, delay: 1000 }),
                        queryRunner.manager.create(SequenceStep, { order: 2, type: 1, x1: 190, y1: 1430, delay: 1000 }),
                        queryRunner.manager.create(SequenceStep, { order: 3, type: 1, x1: 520, y1: 1025, delay: 3000 }),
                        queryRunner.manager.create(SequenceStep, { order: 4, type: 1, x1: 350, y1: 1020, delay: 2000 }),
                        queryRunner.manager.create(SequenceStep, { order: 5, type: 1, x1: 200, y1: 350, delay: 2000 }),
                        queryRunner.manager.create(SequenceStep, { order: 5, type: 1, x1: 200, y1: 350, delay: 2000 }),
                        queryRunner.manager.create(SequenceStep, { order: 5, type: 1, x1: 360, y1: 290, delay: 0 }),
                    ];
                    const denySeq = queryRunner.manager.create(Sequence, {
                        name: 'Denegar Visita',
                        device: device,
                        steps: DenegateSteps,
                    });

                    // Secuencia CloseAllApps para el Device
                    const CloseAllSteps = [
                        queryRunner.manager.create(SequenceStep, { order: 1, type: 1, x1: 360, y1: 1300, delay: 1000 }),

                    ];
                    const closeAllSeq = queryRunner.manager.create(Sequence, {
                        name: 'CloseAllApps',
                        device: device,
                        steps: CloseAllSteps,
                    });

                    sequencesToSave.push(goToCameraSeq, acceptSeq, denySeq, closeAllSeq);

                }

                // 4. Guardar las Sequences y SequenceSteps
                const savedSequences = await queryRunner.manager.save(Sequence, sequencesToSave);

                this.logger.log(`Generación de data correcta [Sequence][Steps]. ${savedSequences.length} Seq.`);
                // 5. Confirma la transacción
                await queryRunner.commitTransaction();


            } catch (err) {
                // Si algo falla, revierte todos los cambios
                await queryRunner.rollbackTransaction();
                this.logger.error('Error al generar data inicial:', err.message);
                // Puedes relanzar el error si es crítico para la inicialización
                // throw err; 
            } finally {
                // Libera el query runner
                await queryRunner.release();
            }
        }


    }


}