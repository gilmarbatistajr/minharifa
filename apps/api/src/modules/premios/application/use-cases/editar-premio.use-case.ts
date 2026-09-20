import { Inject, Injectable } from '@nestjs/common';
import { PREMIO_REPOSITORY, PremioRepository } from '../../domain/repositories/premio.repository';
import { DadosAtualizacaoPremio } from '../../domain/entities/premio.entity';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';

export interface EditarPremioInput extends DadosAtualizacaoPremio {
  administradorId: string;
  premioId: string;
}

const STATUS_VENDAS_EM_ANDAMENTO = [
  'AGUARDANDO_ABERTURA',
  'VENDAS_ABERTAS',
  'VENDAS_ENCERRADAS',
  'COTAS_ESGOTADAS',
];

/**
 * Cobre cadastro-de-premio.feature: "Edição de um prêmio ainda não vinculado
 * a uma campanha" e "Tentativa de edição de um prêmio já vinculado a uma
 * campanha em andamento".
 */
@Injectable()
export class EditarPremioUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: EditarPremioInput): Promise<void> {
    const premio = await this.premioRepository.buscarPorId(input.premioId);

    if (!premio || !premio.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Prêmio não encontrado.');
    }

    const campanhasVinculadas = await this.campanhaRepository.listarPorPremioId(input.premioId);

    if (campanhasVinculadas.some((campanha) => STATUS_VENDAS_EM_ANDAMENTO.includes(campanha.statusVendas))) {
      throw new Error('O prêmio não pode ser editado enquanto a campanha estiver em andamento.');
    }

    premio.atualizar({
      nome: input.nome,
      descricao: input.descricao,
      valor: input.valor,
      valorOpcaoDinheiro: input.valorOpcaoDinheiro,
    });

    await this.premioRepository.salvar(premio);
  }
}
