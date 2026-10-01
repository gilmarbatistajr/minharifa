import { IsString } from 'class-validator';

export class LoginOperadorDto {
  @IsString()
  login!: string;

  @IsString()
  senha!: string;
}
