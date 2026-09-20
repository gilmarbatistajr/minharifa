import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';
import { PermissaoRecursoDto } from './permissao-recurso.dto';

export class CadastrarAdministradorMembroDto {
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  telefone!: string;

  @IsString()
  cpf!: string;

  @IsString()
  rg!: string;

  @IsString()
  @MinLength(6)
  senha!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissaoRecursoDto)
  permissoes!: PermissaoRecursoDto[];
}
