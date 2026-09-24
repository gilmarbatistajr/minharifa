import { IsEmail, IsString, MinLength } from 'class-validator';

export class CadastrarAdministradorDto {
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;
}
