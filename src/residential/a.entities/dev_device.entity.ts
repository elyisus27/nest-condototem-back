
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Sequence } from "./dev_sequence.entity";


@Entity('dev_device')
export class Device {

    @PrimaryGeneratedColumn('increment', { name: 'device_id', comment: 'Identificador unico de la tabla' })
    deviceId: number;

    @Column({ name: 'name', type: 'varchar', length: 100, comment: 'First name for the user' })
    deviceName: string;

    @Column({ name: 'description', type: 'varchar', length: 100, comment: 'device descritpion' })
    description: string;

    @Column({ name: 'adb_device', type: 'varchar', length: 20, comment: 'adb device name' })
    adbDevice: string;

    @JoinTable()
    @OneToMany(() => Sequence, seq => seq.device, { cascade: true, eager: true })
    sequences?: Sequence[];

    @Column({ name: 'gpio_pin', type: 'int', default: 1 })
    gpioPin?: number;

    @Column({ name: 'ms_pulse', type: 'int', default: 200 })
    msPulse?: number;

    @Column({ name: 'tag_enabled', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is enabled for automation loop', default: 1 })
    tagEnabled?: number;

    @Column({ name: 'tag_active', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is actived', default: 1 })
    tagActive?: number;

    @Column({ name: 'tag_delete', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete?: number;

}
