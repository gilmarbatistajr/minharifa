import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';

export interface ContarSorteiosDoGrupoInput {
  administradorId: string;
  grupoId: string;
}

export interface ContarSorteiosDoGrupoOutput {
  finalizados: number;
  emAndamento: number;
}

const STATUS_EM_ANDAMENTO = [
  'AGUARDANDO_ABERTURA',
  'VENDAS_ABERTAS',
  'VENDAS_ENCERRADAS',
  'COTAS_ESGOTADAS',
];

/** Cobre meus-grupos.feature: "contagem de sorteios finalizados/em andamento de um grupo". */
@Injectable()
export class ContarSorteiosDoGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
  ) {}

  async executar(input: ContarSorteiosDoGrupoInput): Promise<ContarSorteiosDoGrupoOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const sorteios = await this.sorteioRepository.listarPorGrupo(input.grupoId);

    return sorteios.reduce(
      (contagem, sorteio) => {
        if (sorteio.status === 'FINALIZADO') {
          contagem.finalizados += 1;
        } else if (STATUS_EM_ANDAMENTO.includes(sorteio.status)) {
          contagem.emAndamento += 1;
        }
        return contagem;
      },
      { finalizados: 0, emAndamento: 0 },
    );
  }
}
