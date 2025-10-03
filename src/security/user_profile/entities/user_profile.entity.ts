import { SecProfile } from '../../../security/profile/entities/profile.entity';
import { SecUser } from '../../../security/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, Unique, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';


@Entity('sec_user_profile')
@Unique('userProfile', ['userId', 'profileId'])
export class SecUserProfile {


    @PrimaryColumn()
    @PrimaryGeneratedColumn('increment', { name: 'user_profile_id', comment: 'Id for user creation' })
    userProfileId: number;

    @Column({ name: 'user_id', type: 'int', comment: 'User Id for the user profile' })
    userId: number;

    @Column({ name: 'profile_id', type: 'int', comment: 'Profile id for the user profile' })
    profileId: number;

    @Column({ type: 'tinyint', name: 'tag_delete', width: 1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete?: number;

    @JoinColumn({ name: "user_id" })
    @ManyToOne(type => SecUser, user => user.userProfiles)
    user?: SecUser

    @JoinColumn({ name: "profile_id" })
    @ManyToOne(type => SecProfile, profile => profile.userProfiles, { eager: true })
    profile?: SecProfile
}