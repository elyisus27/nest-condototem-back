

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty, validate, IsEmail, IsEmpty, isNotEmpty } from 'class-validator';
import { ResponseGeneric } from '../../../globals/reponse.class';
import { SecUserProfile } from '../../../security/user_profile/entities/user_profile.entity';
import { SecProfile } from '../../profile/entities/profile.entity';
import { SecUser } from '../entities/user.entity';



export class CreateUserDto {


    @IsNotEmpty()
    @ApiProperty({ description: 'Name for the user' })
    username: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Password for the user' })
    password: string;

    @IsNotEmpty()
    @ApiProperty({ description: 'First name for the user' })
    firstName: string;

    @IsNotEmpty()
    @ApiProperty({ description: 'Last name for the user' })
    lastName: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Mother last name for the user' })
    motherLastName?: string;

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ description: 'Email for the user' })
    email: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Photo for the user' })
    photo?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Date of entry of the user' })
    entryDate?: Date;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Date of leave of the user' })
    leaveDate?: Date;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Phone for the user' })
    phone?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes about the user' })
    notes?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Address for the user' })
    address?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Employee number for the user' })
    employeeNumber?: string;

    @IsOptional()
    @ApiProperty({ description: 'Profiles for the user' })
    profiles?: SecProfile[];

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating if a registry is blocked' })
    tagBlocked?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating if a registry is actived' })
    tagActive?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating if a registry is eliminated' })
    tagDelete?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating the user who created this record' })
    createdBy?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating the record created date' })
    createdAt?: Date;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating the last user who updated this record' })
    updatedBy?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating the record updated date' })
    updatedAt?: Date;

    @IsNotEmpty()
    @ApiProperty({ description: 'user Profiles' })
    userProfiles?: SecUserProfile[];



    validateModel?(obj: SecUser) {

        let response = new ResponseGeneric();
        let data = new SecUser();

        Object.assign(data, obj);

        return new Promise((resolve, reject) => {

            validate(data).then((errors) => {

                if (errors.length > 0) {
                    reject(Object.assign(response, { success: false, message: 'CAMPOS INCOMPLETOS', exception: errors }));
                } else {
                    resolve(errors);
                }

            }).catch((exception) => {
                reject(Object.assign(response, { success: false, message: 'ERROR EN MODELO', exception }));
            });

        });

    }

}