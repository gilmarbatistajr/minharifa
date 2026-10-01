import { IsBoolean, IsIn } from 'class-validator';

export const RECURSOS_MENU_ADMIN = [
  'CAMPANHAS',
  'GRUPOS',
  'PREMIOS',
  'OPERADORES',
  'ALERTAS_AUTOMATICOS',
  'ADMINISTRADORES',
] as const;

export class PermissaoRecursoDto {
  @IsIn(RECURSOS_MENU_ADMIN)
  recurso!: (typeof RECURSOS_MENU_ADMIN)[number];

  @IsBoolean()
  podeCriar!: boolean;

  @IsBoolean()
  podeEditar!: boolean;

  @IsBoolean()
  podeRemover!: boolean;
}
