import { SecUserProfile } from '../../../security/user_profile/entities/user_profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn, JoinTable } from 'typeorm';


@Entity('sec_profile')
export class SecProfile {

    @PrimaryGeneratedColumn('increment', { name: 'profile_id', comment: 'Id for profile creation' })
    profileId: number;

    @Column({ name: 'profile_name', type: 'varchar', length: 100, comment: 'Name for the profile', unique: true })
    profileName: string;

    @Column({ name: 'tag_active', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is actived', default: 1 })
    tagActive?: number;

    @Column({ name: 'tag_delete', type: 'tinyint', width: 1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete?: number;

    @Column({ name: 'created_by', type: 'int', comment: 'Property indicating the user who created this record', nullable: true })
    createdBy?: number;

    @CreateDateColumn({ name: 'created_at', comment: 'Property indicating the record created date', nullable: true })
    createdAt?: Date;

    @Column({ name: 'updated_by', type: 'int', comment: 'Property indicating the last user who updated this record', nullable: true })
    updatedBy?: number;

    @UpdateDateColumn({ name: 'updated_at', comment: 'Property indicating the record updated date', nullable: true })
    updatedAt?: Date;

    @OneToMany(type => SecUserProfile, userProfile => userProfile.profile)
    userProfiles?: SecUserProfile[];



}
