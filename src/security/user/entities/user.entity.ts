import { hash } from 'bcryptjs';
import { SecUserProfile } from '../../../security/user_profile/entities/user_profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';


@Entity('sec_user')
export class SecUser {

    @PrimaryGeneratedColumn('increment', { name: 'user_id', comment: 'Id for user creation' })
    userId: number;

    @Column({ name: 'username', type: 'varchar', length: 100, comment: 'Name for the user', unique: true })
    username: string;

    @Column({ name: 'password', type: 'varchar', length: 100, comment: 'Password for the user' })
    password: string;

    @Column({ name: 'first_name', type: 'varchar', length: 100, comment: 'First name for the user' })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100, comment: 'Last name for the user' })
    lastName: string;

    @Column({ name: 'mother_last_name', type: 'varchar', length: 100, comment: 'Mother last name for the user', nullable: true })
    motherLastName?: string;

    @Column({ name: 'email', type: 'varchar', length: 50, comment: 'Email for the user', unique: true })
    email: string;

    @Column({ name: 'entry_date', comment: 'date of entry of the user', nullable: true })
    entryDate?: Date;

    @Column({ name: 'leave_date', comment: 'date of leave of the user', nullable: true })
    leaveDate?: Date;

    @Column({ name: 'phone', type: 'varchar', length: 20, comment: 'Phone for the user', nullable: true })
    phone?: string;

    @Column({ name: 'notes', type: 'varchar', length: 250, comment: 'Notes about the user', nullable: true })
    notes?: string;

    @Column({ name: 'address', type: 'varchar', length: 150, comment: 'Address for the user', nullable: true })
    address?: string;

    @Column({ name: 'tag_blocked', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is blocked', default: 0 })
    tagBlocked?: number;

    @Column({ name: 'tag_active', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is actived', default: 1 })
    tagActive?: number;

    @Column({ name: 'tag_delete', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete?: number;

    @Column({ name: 'created_by', type: 'int', comment: 'Property indicating the user who created this record', nullable: true })
    createdBy?: number;

    @CreateDateColumn({ name: 'created_at', comment: 'Property indicating the record created date', nullable: true })
    createdAt?: Date;

    @Column({ type: 'int', name: 'updated_by', comment: 'Property indicating the last user who updated this record', nullable: true })
    updatedBy?: number;

    @UpdateDateColumn({ name: 'updated_at', comment: 'Property indicating the record updated date', nullable: true })
    updatedAt?: Date;

    @OneToMany(type => SecUserProfile, userProfile => userProfile.user, { cascade: true, eager: true })
    userProfiles?: SecUserProfile[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashPasword() {
        if (!this.password) return;
        this.password = await hash(this.password, 10);
    }

}