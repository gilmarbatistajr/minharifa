import { StatusVendasCampanha } from '../../../campanhas/domain/entities/campanha.entity';

/** Estados de venda em que uma campanha é considerada "em andamento" para fins de bloqueio de edição/remoção do prêmio. */
export const STATUS_VENDAS_EM_ANDAMENTO: StatusVendasCampanha[] = [
  'AGUARDANDO_ABERTURA',
  'VENDAS_ABERTAS',
  'VENDAS_ENCERRADAS',
  'COTAS_ESGOTADAS',
];
