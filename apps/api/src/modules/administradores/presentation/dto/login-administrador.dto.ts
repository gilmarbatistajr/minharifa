import { IsEmail, IsString } from 'class-validator';

export class LoginAdministradorDto {
  @IsEmail()
  email!: string;

  @IsString()
  senha!: string;
}
