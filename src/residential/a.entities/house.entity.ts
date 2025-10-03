
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, IntegerType, JoinTable } from 'typeorm';
import { Devices } from './devices.entity';



@Entity('res_house')
export class ResHouse {
    @PrimaryGeneratedColumn('increment', { name: 'house_id', comment: 'Id for house creation' })
    houseId: number;

    @Column({ name: 'client_id', type: 'integer', comment: 'clientId '})
    clientId: number;

    @Column({ type: 'varchar', name: 'street', comment: 'Street the client', nullable: false, })
    street: string;

    // @Column({ type: 'varchar', name: 'interior_number', comment: 'Interior the client', nullable: true, })
    // interiorNumber: string;

    @Column({ type: 'tinyint', name: 'exterior_number', comment: 'Exterior the client', nullable: false, })
    exteriorNumber: number;
    
    @Column({ type: 'tinyint', name: 'debtor', comment: 'Exterior the client', nullable: true,  default:0 })
    debtor: number;

    @Column({ type:'tinyint', name:'tag_active', width:1, comment: 'Property indicating if a registry is actived', default: 1 })
    tagActive: number;
        
    @Column({ type:'tinyint', name:'tag_delete', width:1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete: number;
    
    @Column({ type:'int', name:'created_by', comment: 'Property indicating the user who created this record', nullable: true  })
    createdBy: number;
    
    @CreateDateColumn( { name:'created_at', comment: 'Property indicating the record created date', nullable: true  })
    createdAt: Date;
    
    @Column({ type:'int', name:'updated_by', comment: 'Property indicating the last user who updated this record', nullable: true  })
    updatedBy: number;
    
    @UpdateDateColumn({ name:'updated_at', comment: 'Property indicating the record updated date', nullable: true  })
    updatedAt: Date;

    // @JoinTable()
    // @OneToMany(() => ResClient, client => client.house)
    // clients: ResClient[] ;

}
