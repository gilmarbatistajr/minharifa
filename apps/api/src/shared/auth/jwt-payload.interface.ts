export type TipoPrincipal = 'administrador' | 'comprador';

export interface JwtPayload {
  sub: string;
  tipo: TipoPrincipal;
  grupoId?: string;
}

export interface PrincipalAutenticado {
  tipo: TipoPrincipal;
  administradorId?: string;
  compradorId?: string;
  grupoId?: string;
}
