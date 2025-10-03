import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, Length } from "class-validator";

export class CreateDeviceDto {


    @IsNotEmpty()
    @ApiProperty({ description: 'device name' })
    deviceName: string;


    @IsNotEmpty()
    @ApiProperty({ description: 'device description' })
    description: string;


    @IsNotEmpty()
    @ApiProperty({ description: 'adb device name' })
    adb_device: string;

}
