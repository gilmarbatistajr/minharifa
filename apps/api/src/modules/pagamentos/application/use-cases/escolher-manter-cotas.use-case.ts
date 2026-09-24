import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  ESCOLHA_POS_CANCELAMENTO_REPOSITORY,
  EscolhaPosCancelamentoRepository,
} from '../../domain/repositories/escolha-pos-cancelamento.repository';
import {
  CREDITO_PENDENTE_REPOSITORY,
  CreditoPendenteRepository,
} from '../../domain/repositories/credito-pendente.repository';
import { CreditoPendente } from '../../domain/entities/credito-pendente.entity';

export interface EscolherManterCotasInput {
  escolhaId: string;
  compradorId: string;
}

export interface EscolherManterCotasOutput {
  creditoId: string;
}

/**
 * Cobre cancelamento-de-sorteio.feature: "Comprador escolhe manter a
 * quantidade de cotas para a próxima campanha" e "Ainda não existe uma
 * próxima campanha no momento da escolha" — em ambos os casos o crédito é
 * registrado; o resgate das cotas específicas acontece em um segundo passo
 * (ResgatarCreditoUseCase), quando uma campanha de destino já existir.
 */
@Injectable()
export class EscolherManterCotasUseCase {
  constructor(
    @Inject(ESCOLHA_POS_CANCELAMENTO_REPOSITORY)
    private readonly escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(CREDITO_PENDENTE_REPOSITORY)
    private readonly creditoPendenteRepository: CreditoPendenteRepository,
  ) {}

  async executar(input: EscolherManterCotasInput, agora: Date = new Date()): Promise<EscolherManterCotasOutput> {
    const escolha = await this.escolhaPosCancelamentoRepository.buscarPorId(input.escolhaId);

    if (!escolha || escolha.compradorId !== input.compradorId) {
      throw new Error('Escolha não encontrada.');
    }

    const campanha = await this.campanhaRepository.buscarPorId(escolha.campanhaId);
    if (!campanha) {
      throw new Error('Campanha de origem não encontrada.');
    }

    escolha.escolherManterCotas(agora);
    await this.escolhaPosCancelamentoRepository.salvar(escolha);

    const credito = new CreditoPendente(
      randomUUID(),
      input.compradorId,
      campanha.grupoId!,
      escolha.campanhaId,
      escolha.quantidadeCotas,
      escolha.valorTotal,
      false,
      agora,
    );

    await this.creditoPendenteRepository.criar(credito);

    return { creditoId: credito.id };
  }
}
