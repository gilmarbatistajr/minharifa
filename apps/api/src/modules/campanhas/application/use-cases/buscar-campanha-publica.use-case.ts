import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
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
  telefoneSuporte: string;
  status: StatusCampanha;
  statusVendas: StatusVendasCampanha;
  dataRealizacao: Date | null;
}

/**
 * Cobre o "Link de Vendas": alguém sem conta (ainda) abre o link direto de
 * uma campanha para ver do que se trata antes de decidir criar conta/entrar.
 * Só existe para campanhas já lançadas para um grupo — devolve exatamente o
 * mesmo "não encontrada" tanto para id inexistente quanto para campanha
 * ainda não lançada, pra não revelar qual dos dois é o caso. Nunca inclui
 * campos sensíveis (chave Pix do administrador, dados do vencedor, IDs
 * internos de administrador/grupo) — só o que a página de compra precisa
 * mostrar.
 */
@Injectable()
export class BuscarCampanhaPublicaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: BuscarCampanhaPublicaInput): Promise<CampanhaPublica> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || !campanha.grupoId || campanha.estaRemovida()) {
      throw new Error('Campanha não encontrada.');
    }

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
      telefoneSuporte: campanha.telefoneSuporte,
      status: campanha.status,
      statusVendas: campanha.statusVendas,
      dataRealizacao: campanha.dataRealizacao,
    };
  }
}
