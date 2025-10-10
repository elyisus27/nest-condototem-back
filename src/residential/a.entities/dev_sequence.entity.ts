import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, JoinTable } from "typeorm";
import { Device } from "./dev_device.entity";
import { SequenceStep } from "./dev_sequence_step.entity";

@Entity('dev_sequence')
export class Sequence {
  @PrimaryGeneratedColumn('increment', { name: 'sequence_id', comment: 'Identificador unico de la tabla' })
  sequenceId: number;

  @Column({ name: 'name', type: 'varchar', length: 100, comment: 'Sequence Name' })
  name: string; // GoToCamera, Aceptar, Denegar...

  @OneToMany(() => SequenceStep, step => step.sequence, { cascade: true, eager: true })
  steps: SequenceStep[];

  @JoinColumn({ name: 'device_id' })
  @ManyToOne(() => Device, device => device.deviceId, { onDelete: 'CASCADE' })
  device: Device;
}
