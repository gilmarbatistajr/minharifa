import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, MinLength, ValidateNested } from 'class-validator';
import { PermissaoRecursoOperadorDto } from './permissao-recurso-operador.dto';

export class CadastrarOperadorDto {
  @IsString()
  nomeCompleto!: string;

  @IsString()
  endereco!: string;

  @IsString()
  cpf!: string;

  @IsString()
  rg!: string;

  @IsString()
  telefone!: string;

  @IsString()
  login!: string;

  @IsString()
  @MinLength(6)
  senha!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  grupoIds!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissaoRecursoOperadorDto)
  permissoes!: PermissaoRecursoOperadorDto[];
}
