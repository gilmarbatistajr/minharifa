import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../sorteios/domain/repositories/cota.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { PREMIO_REPOSITORY, PremioRepository } from '../../../premios/domain/repositories/premio.repository';

export interface CadastrarSorteioInput {
  administradorId: string;
  grupoId: string;
  nome: string;
  descricao: string;
  premioIds: string[];
  quantidadeCotas: number;
  valorCota: number;
  dataAberturaVendas: Date;
  dataEncerramentoVendas: Date;
  dataRealizacao: Date;
}

export interface CadastrarSorteioOutput {
  sorteioId: string;
}

/**
 * Cobre cadastro-de-sorteio.feature: criação de um sorteio dentro de um
 * grupo, vinculado a um ou mais prêmios já cadastrados pelo administrador.
 * Já materializa as cotas (1..quantidadeCotas) como DISPONIVEL — sem isso
 * não haveria nada para reservar/pagar depois.
 */
@Injectable()
export class CadastrarSorteioUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: CadastrarSorteioInput): Promise<CadastrarSorteioOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    if (input.premioIds.length === 0) {
      throw new Error('Selecione ao menos um prêmio para o sorteio.');
    }

    for (const premioId of input.premioIds) {
      const premio = await this.premioRepository.buscarPorId(premioId);
      if (!premio || !premio.pertenceAoAdministrador(input.administradorId)) {
        throw new Error('Um dos prêmios selecionados não foi encontrado.');
      }
    }

    if (input.quantidadeCotas <= 0) {
      throw new Error('A quantidade de cotas deve ser maior que zero.');
    }

    if (input.valorCota <= 0) {
      throw new Error('O valor da cota deve ser maior que zero.');
    }

    if (input.dataEncerramentoVendas <= input.dataAberturaVendas) {
      throw new Error('A data de encerramento das vendas deve ser depois da abertura.');
    }

    if (input.dataRealizacao < input.dataEncerramentoVendas) {
      throw new Error('A data de realização deve ser igual ou depois do encerramento das vendas.');
    }

    const sorteio = new Sorteio(
      randomUUID(),
      input.grupoId,
      input.nome,
      input.descricao,
      input.premioIds,
      input.dataAberturaVendas,
      input.dataEncerramentoVendas,
      input.dataRealizacao,
      input.quantidadeCotas,
      input.valorCota,
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );

    await this.sorteioRepository.criar(sorteio);

    const cotas = Array.from(
      { length: input.quantidadeCotas },
      (_, indice) => new Cota(randomUUID(), sorteio.id, indice + 1, 'DISPONIVEL', null, null, null),
    );
    await this.cotaRepository.criarEmLote(cotas);

    return { sorteioId: sorteio.id };
  }
}
