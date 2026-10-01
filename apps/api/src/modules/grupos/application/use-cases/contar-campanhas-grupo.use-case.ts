import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';

export interface ContarCampanhasDoGrupoInput {
  administradorId: string;
  grupoId: string;
}

export interface ContarCampanhasDoGrupoOutput {
  finalizados: number;
  emAndamento: number;
}

const STATUS_VENDAS_EM_ANDAMENTO = [
  'AGUARDANDO_ABERTURA',
  'VENDAS_ABERTAS',
  'VENDAS_ENCERRADAS',
  'COTAS_ESGOTADAS',
];

/** Cobre meus-grupos.feature: "contagem de campanhas finalizadas/em andamento de um grupo". */
@Injectable()
export class ContarCampanhasDoGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: ContarCampanhasDoGrupoInput): Promise<ContarCampanhasDoGrupoOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const campanhas = await this.campanhaRepository.listarPorGrupo(input.grupoId);

    return campanhas.reduce(
      (contagem, campanha) => {
        if (campanha.statusVendas === 'FINALIZADO') {
          contagem.finalizados += 1;
        } else if (STATUS_VENDAS_EM_ANDAMENTO.includes(campanha.statusVendas)) {
          contagem.emAndamento += 1;
        }
        return contagem;
      },
      { finalizados: 0, emAndamento: 0 },
    );
  }
}
