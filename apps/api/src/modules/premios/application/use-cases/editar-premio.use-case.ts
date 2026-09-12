import { Inject, Injectable } from '@nestjs/common';
import { PREMIO_REPOSITORY, PremioRepository } from '../../domain/repositories/premio.repository';
import { DadosAtualizacaoPremio } from '../../domain/entities/premio.entity';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';

export interface EditarPremioInput extends DadosAtualizacaoPremio {
  administradorId: string;
  premioId: string;
}

const STATUS_SORTEIO_EM_ANDAMENTO = [
  'AGUARDANDO_ABERTURA',
  'VENDAS_ABERTAS',
  'VENDAS_ENCERRADAS',
  'COTAS_ESGOTADAS',
];

/**
 * Cobre cadastro-de-premio.feature: "Edição de um prêmio ainda não vinculado
 * a um sorteio" e "Tentativa de edição de um prêmio já vinculado a um
 * sorteio em andamento".
 */
@Injectable()
export class EditarPremioUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
  ) {}

  async executar(input: EditarPremioInput): Promise<void> {
    const premio = await this.premioRepository.buscarPorId(input.premioId);

    if (!premio || !premio.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Prêmio não encontrado.');
    }

    const sorteioVinculado = await this.sorteioRepository.buscarPorPremioId(input.premioId);

    if (sorteioVinculado && STATUS_SORTEIO_EM_ANDAMENTO.includes(sorteioVinculado.status)) {
      throw new Error('O prêmio não pode ser editado enquanto o sorteio estiver em andamento.');
    }

    premio.atualizar({
      nome: input.nome,
      descricao: input.descricao,
      fotoUrl: input.fotoUrl,
      valor: input.valor,
      valorOpcaoDinheiro: input.valorOpcaoDinheiro,
    });

    await this.premioRepository.salvar(premio);
  }
}
