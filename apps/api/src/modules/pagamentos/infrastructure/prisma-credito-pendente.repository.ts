import { Injectable } from '@nestjs/common';
import { CreditoPendente as CreditoPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreditoPendente } from '../domain/entities/credito-pendente.entity';
import { CreditoPendenteRepository } from '../domain/repositories/credito-pendente.repository';

function paraDominio(registro: CreditoPrisma): CreditoPendente {
  return new CreditoPendente(
    registro.id,
    registro.compradorId,
    registro.grupoId,
    registro.sorteioOrigemId,
    registro.quantidadeCotas,
    registro.valorTotal.toNumber(),
    registro.utilizado,
    registro.criadoEm,
  );
}

@Injectable()
export class PrismaCreditoPendenteRepository implements CreditoPendenteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<CreditoPendente | null> {
    const registro = await this.prisma.creditoPendente.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async criar(credito: CreditoPendente): Promise<void> {
    await this.prisma.creditoPendente.create({
      data: {
        id: credito.id,
        compradorId: credito.compradorId,
        grupoId: credito.grupoId,
        sorteioOrigemId: credito.sorteioOrigemId,
        quantidadeCotas: credito.quantidadeCotas,
        valorTotal: credito.valorTotal,
        utilizado: credito.utilizado,
        criadoEm: credito.criadoEm,
      },
    });
  }

  async salvar(credito: CreditoPendente): Promise<void> {
    await this.prisma.creditoPendente.update({
      where: { id: credito.id },
      data: { utilizado: credito.utilizado },
    });
  }
}
