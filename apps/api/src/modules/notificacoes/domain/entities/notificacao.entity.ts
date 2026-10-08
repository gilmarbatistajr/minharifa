export type TipoNotificacao =
  | 'NOVA_VENDA'
  | 'COTAS_VENDIDAS_20'
  | 'COTAS_VENDIDAS_50'
  | 'COTAS_VENDIDAS_75'
  | 'COTAS_VENDIDAS_90'
  | 'COTAS_VENDIDAS_100';

/** Marcos de cotas vendidas (em %) que geram notificação — cada um dispara uma única vez por campanha. */
export const MARCOS_COTAS_VENDIDAS = [20, 50, 75, 90, 100] as const;
export type MarcoCotasVendidas = (typeof MARCOS_COTAS_VENDIDAS)[number];

export function tipoDoMarco(marco: MarcoCotasVendidas): TipoNotificacao {
  return `COTAS_VENDIDAS_${marco}` as TipoNotificacao;
}

/**
 * Aviso exibido no menu "Notificações" do painel. Pertence ao administrador
 * dono da campanha; um operador enxerga as dos grupos a que tem acesso.
 */
export class Notificacao {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public readonly campanhaId: string | null,
    public readonly grupoId: string | null,
    public readonly tipo: TipoNotificacao,
    public readonly mensagem: string,
    public lidaEm: Date | null,
    public readonly criadoEm: Date,
  ) {}

  estaLida(): boolean {
    return this.lidaEm !== null;
  }

  marcarComoLida(agora: Date): void {
    if (!this.lidaEm) {
      this.lidaEm = agora;
    }
  }

  static mensagemNovaVenda(nomeCampanha: string): string {
    return `Nova venda de cota na campanha ${nomeCampanha}, confirme o pagamento`;
  }

  static mensagemMarco(marco: MarcoCotasVendidas, nomeCampanha: string): string {
    return marco === 100
      ? `Todas as cotas da campanha ${nomeCampanha} foram vendidas`
      : `${marco}% das cotas da campanha ${nomeCampanha} vendidas`;
  }
}
