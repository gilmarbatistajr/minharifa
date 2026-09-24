import { IsBoolean, IsIn } from 'class-validator';

export const RECURSOS_MENU_OPERADOR = ['CAMPANHAS', 'GRUPOS', 'PREMIOS', 'ALERTAS_AUTOMATICOS'] as const;

export class PermissaoRecursoOperadorDto {
  @IsIn(RECURSOS_MENU_OPERADOR)
  recurso!: (typeof RECURSOS_MENU_OPERADOR)[number];

  @IsBoolean()
  podeCriar!: boolean;

  @IsBoolean()
  podeEditar!: boolean;

  @IsBoolean()
  podeRemover!: boolean;
}
