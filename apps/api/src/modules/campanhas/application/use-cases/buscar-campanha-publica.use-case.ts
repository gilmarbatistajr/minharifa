import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { FormaVendaCotas, StatusCampanha, StatusVendasCampanha } from '../../domain/entities/campanha.entity';

export interface BuscarCampanhaPublicaInput {
  campanhaId: string;
}

export interface CampanhaPublica {
  id: string;
  nome: string;
  descricao: string;
  fotoUrl: string | null;
  valorCota: number;
  quantidadeCotas: number;
  quantidadeMinimaPorCompra: number;
  quantidadeMaximaPorCompra: number | null;
  formaVenda: FormaVendaCotas;
  /** Contato de suporte do grupo ao qual a campanha está vinculada. */
  telefoneSuporte: string;
  status: StatusCampanha;
  statusVendas: StatusVendasCampanha;
  dataRealizacao: Date | null;
  reservaExigeEmail: boolean;
  reservaExigeNome: boolean;
  reservaExigeTelefone: boolean;
  reservaExigeConfirmacaoTelefone: boolean;
  reservaExigeCpf: boolean;
  /** Link de convite do grupo de WhatsApp da campanha — feito pra ser compartilhado, então é público. */
  linkGrupoWhatsapp: string | null;
  /** Só preenchido quando `status === 'FINALIZADA'` — antes disso não existe vencedor. */
  cotaVencedoraNumero: number | null;
  vencedorNome: string | null;
  vencedorTelefone: string | null;
}

/**
 * Cobre o "Link de Vendas": alguém sem conta (ainda) abre o link direto de
 * uma campanha para ver do que se trata antes de decidir criar conta/entrar.
 * Só existe para campanhas já lançadas para um grupo — devolve exatamente o
 * mesmo "não encontrada" tanto para id inexistente quanto para campanha
 * ainda não lançada, pra não revelar qual dos dois é o caso. Nunca inclui
 * campos sensíveis (chave Pix do administrador, IDs internos de
 * administrador/grupo) — só o que a página de compra precisa mostrar. Os
 * dados do vencedor só saem depois de finalizada (ver `status`); a página
 * de compra usa isso pra trocar a seleção de cotas pelo resultado.
 */
@Injectable()
export class BuscarCampanhaPublicaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
  ) {}

  async executar(input: BuscarCampanhaPublicaInput): Promise<CampanhaPublica> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || !campanha.grupoId || campanha.estaRemovida()) {
      throw new Error('Campanha não encontrada.');
    }

    const finalizada = campanha.status === 'FINALIZADA';
    const grupo = await this.grupoRepository.buscarPorId(campanha.grupoId);

    return {
      id: campanha.id,
      nome: campanha.nome,
      descricao: campanha.descricao,
      fotoUrl: campanha.fotoUrl,
      valorCota: campanha.valorCota,
      quantidadeCotas: campanha.quantidadeCotas,
      quantidadeMinimaPorCompra: campanha.quantidadeMinimaPorCompra,
      quantidadeMaximaPorCompra: campanha.quantidadeMaximaPorCompra,
      formaVenda: campanha.formaVenda,
      telefoneSuporte: grupo?.identificadorWhatsapp ?? '',
      status: campanha.status,
      statusVendas: campanha.statusVendas,
      dataRealizacao: campanha.dataRealizacao,
      reservaExigeEmail: campanha.reservaExigeEmail,
      reservaExigeNome: campanha.reservaExigeNome,
      reservaExigeTelefone: campanha.reservaExigeTelefone,
      reservaExigeConfirmacaoTelefone: campanha.reservaExigeConfirmacaoTelefone,
      reservaExigeCpf: campanha.reservaExigeCpf,
      linkGrupoWhatsapp: grupo?.linkWhatsapp ?? null,
      cotaVencedoraNumero: finalizada ? campanha.cotaVencedoraNumero : null,
      vencedorNome: finalizada ? campanha.vencedorNome : null,
      vencedorTelefone: finalizada ? campanha.vencedorTelefone : null,
    };
  }
}
