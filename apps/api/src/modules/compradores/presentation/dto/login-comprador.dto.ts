import { IsEmail, IsString } from 'class-validator';

export class LoginCompradorDto {
  @IsEmail()
  email!: string;

  @IsString()
  senha!: string;
}
