export type TipoPrincipal = 'administrador' | 'comprador' | 'operador';

export interface JwtPayload {
  sub: string;
  tipo: TipoPrincipal;
  grupoId?: string;
}

export interface PrincipalAutenticado {
  tipo: TipoPrincipal;
  administradorId?: string;
  compradorId?: string;
  operadorId?: string;
  grupoId?: string;
}
