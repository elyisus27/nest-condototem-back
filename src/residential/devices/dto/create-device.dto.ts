import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, Length } from "class-validator";
import { Sequence } from "../../a.entities/dev_sequence.entity";
//import { Sequence } from "../../a.entities/sequences.entity";

//Create or update dto
export class CreateDeviceDto {

    @IsOptional()
    @ApiProperty({ description: 'device id' })
    deviceId: number;

    @IsNotEmpty()
    @ApiProperty({ description: 'device name' })
    deviceName: string;


    @IsNotEmpty()
    @ApiProperty({ description: 'device description' })
    description: string;


    @IsNotEmpty()
    @ApiProperty({ description: 'adb device name' })
    adbDevice: string;

    @IsOptional()
    @ApiProperty({ description: 'Secuencias de pasos para acciones' })
    sequences: Sequence[];

}
