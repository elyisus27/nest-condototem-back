import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Sequence } from "./dev_sequence.entity";

@Entity('dev_sequence_step')
export class SequenceStep {
  @PrimaryGeneratedColumn()
  stepId: number;

  @Column({ name: 'order', type: 'int', comment: 'step order in sequence' })
  order: number;

  @Column({ name: 'type', type: 'tinyint', comment: 'spet type, 1 for tap, 2 for swap' })
  type: number;

  @Column({ name: 'x1', type: 'int', comment: 'coordinate x1, for step' })
  x1: number;

  @Column({ name: 'y1', type: 'int', comment: 'coordinate y1, for step' })
  y1: number;

  @Column({ name: 'x2', type: 'int', comment: 'coordinate x2, for step', nullable:true })
  x2: number;

  @Column({ name: 'y2', type: 'int', comment: 'coordinate y2, for step', nullable:true })
  y2: number;
  
  @Column({ name: 'swap_time', type: 'int', comment: 'swap time for de swap adb move', nullable:true })
  swapTime: number;

  @Column({ name: 'delay', type: 'int', comment: 'delay for step' })
  delay: number;

  @JoinColumn({ name: 'sequence_id' })
  @ManyToOne(() => Sequence, seq => seq.sequenceId,  { onDelete: 'CASCADE' })
  sequence: Sequence;
}
