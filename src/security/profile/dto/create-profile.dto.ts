
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, validate } from "class-validator";
import { ResponseGeneric } from "../../../globals/reponse.class";
import { SecUser } from "../../user/entities/user.entity";
import { SecProfile } from "../entities/profile.entity";


export class CreateProfileDto {


    @IsOptional()
    @ApiPropertyOptional({ description: 'Id for profile creation' })
    profileId: number;

    @IsNotEmpty()
    @ApiProperty({ description: 'Name for the profile' })
    profileName: string;

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

    users: SecUser[];


    validateModel?(obj: SecProfile) {
        let response = new ResponseGeneric();
        let data = new SecProfile();

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