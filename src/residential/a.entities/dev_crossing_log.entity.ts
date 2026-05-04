import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dev_crossing_log')
export class CrossingLog {

  @PrimaryGeneratedColumn()
  id: number;

  /** 'aceptar visita' | 'denegar visita' | 'unknown' */
  @Column({ length: 50 })
  state: string;

  /** Nombre del anfitrión principal (colono dueño del QR) */
  @Column({ nullable: true, length: 255 })
  host_name: string;

  /** Número de unidad del anfitrión, ej: "1132 - 15" */
  @Column({ nullable: true, length: 50 })
  host_unit: string;

  /** Co-anfitrión si existe */
  @Column({ nullable: true, length: 255 })
  co_host: string;

  /** Nombre del visitante */
  @Column({ nullable: true, length: 255 })
  visitor_name: string;

  /** Celular del visitante */
  @Column({ nullable: true, length: 50 })
  visitor_phone: string;

  /** Correo del visitante */
  @Column({ nullable: true, length: 255 })
  visitor_email: string;

  /** Tipo de visita: "Visita General", "Paquetería", etc. */
  @Column({ nullable: true, length: 100 })
  visit_type: string;

  /** XML raw del dump para futura reanalisis */
  @Column({ nullable: true, type: 'text' })
  raw_xml: string;

  @CreateDateColumn()
  crossing_at: Date;

  @Column({ name: 'tag_active', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is actived', default: 1 })
  tagActive?: number;
}
