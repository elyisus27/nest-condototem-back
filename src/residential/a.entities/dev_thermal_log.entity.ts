import { Entity, Index, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('dev_thermal_logs')
@Index(['device_id', 'created_at'])
export class DeviceThermalLog {
  @PrimaryGeneratedColumn()
  dev_thermal_id: number;

  @Column()
  device_id: string;

  @Column('float', { nullable: true })
  cpu: number;

  @Column('float', { nullable: true })
  gpu: number;

  @Column('float', { nullable: true })
  battery: number;

  @Column('float', { nullable: true })
  skin: number;

  @Column('float', { nullable: true })
  power_amplifier: number;

  @Column('float', { nullable: true })
  npu: number;

  // En tu DeviceThermalLog entity, agrega:
  @Column('int', { nullable: true })
  battery_level: number;

  @Column('int', { nullable: true })
  battery_status: number;

  @CreateDateColumn()
  created_at: Date;
}