import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { resolverCotasParaReservar } from '../services/resolver-cotas-para-reservar';

export interface ReservarLoteCotasConvidadoInput {
  campanhaId: string;
  numeros?: number[];
  quantidadeAleatoria?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  confirmacaoTelefone?: string;
}

export interface ReservarLoteCotasConvidadoOutput {
  numeros: number[];
  reservaExpiraEm: Date | null;
  tokenReservaConvidado: string;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cobre o checkout sem login: mesma tela "Escolha sua cota" do Link de
 * Vendas, mas pra quem não tem conta. Em vez de um `compradorId`, valida e
 * guarda direto na cota só o contato que a campanha marcou como obrigatório
 * (`reservaExige*`) — nenhum registro de Comprador é criado. O
 * `tokenReservaConvidado` retornado é o que a tela de pagamento usa depois
 * pra localizar essa reserva sem sessão.
 */
@Injectable()
export class ReservarLoteCotasConvidadoUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(
    input: ReservarLoteCotasConvidadoInput,
    agora: Date = new Date(),
  ): Promise<ReservarLoteCotasConvidadoOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || !campanha.grupoId || campanha.estaRemovida()) {
      throw new Error('Campanha não encontrada.');
    }

    const nome = input.nome?.trim() || null;
    const email = input.email?.trim() || null;
    const telefone = input.telefone?.trim() || null;

    if (campanha.reservaExigeNome && !nome) {
      throw new Error('Informe seu nome para reservar.');
    }
    if (campanha.reservaExigeEmail && !email) {
      throw new Error('Informe seu e-mail para reservar.');
    }
    if (email && !REGEX_EMAIL.test(email)) {
      throw new Error('Informe um e-mail válido.');
    }
    if (campanha.reservaExigeTelefone && !telefone) {
      throw new Error('Informe seu telefone para reservar.');
    }
    if (campanha.reservaExigeConfirmacaoTelefone) {
      const confirmacao = input.confirmacaoTelefone?.trim() || null;
      if (!confirmacao) {
        throw new Error('Confirme seu telefone para reservar.');
      }
      if (confirmacao !== telefone) {
        throw new Error('A confirmação de telefone não confere com o telefone informado.');
      }
    }

    const cotasParaReservar = await resolverCotasParaReservar(
      this.cotaRepository,
      campanha,
      input.numeros,
      input.quantidadeAleatoria,
      agora,
    );

    const token = randomUUID();
    for (const cota of cotasParaReservar) {
      cota.reservarParaConvidado(token, { nome, email, telefone }, agora, campanha.expiracaoReservaMinutos);
    }

    for (const cota of cotasParaReservar) {
      await this.cotaRepository.salvar(cota);
    }

    return {
      numeros: cotasParaReservar.map((cota) => cota.numero).sort((a, b) => a - b),
      reservaExpiraEm: cotasParaReservar[0].reservaExpiraEm,
      tokenReservaConvidado: token,
    };
  }
}
