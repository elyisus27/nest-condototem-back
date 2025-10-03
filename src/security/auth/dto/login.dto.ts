import { IsNotEmpty, MaxLength, MinLength } from "class-validator";
export class LoginDto {
    // @IsEmail()
    // email: string;

    @MinLength(4, { message: 'usuario: longitud minima de 4' })
    @IsNotEmpty({ message: 'el usuario no puede estar vacío' })
    @MaxLength(100, { message: 'nombre de usuario: longitud máxima de 100' })
    username: string


    @MinLength(4, { message: 'password: longitud minima de 4' })
    @MaxLength(100, { message: 'password: longitud máxima de 100' })
    @IsNotEmpty({ message: 'la contraseña del usuario no puede estar vacía' })
    password: string




}
