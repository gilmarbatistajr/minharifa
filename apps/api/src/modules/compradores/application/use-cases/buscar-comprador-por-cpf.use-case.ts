import { Inject, Injectable } from '@nestjs/common';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../domain/repositories/comprador.repository';

export interface BuscarCompradorPorCpfInput {
  cpf: string;
}

export interface BuscarCompradorPorCpfOutput {
  compradorId: string;
  nome: string;
  telefone: string;
  endereco: string;
}

/**
 * Cobre cadastro-de-comprador.feature: "Comprador já cadastrado reutiliza
 * seus dados em uma nova compra" — usado para pré-preencher o formulário.
 */
@Injectable()
export class BuscarCompradorPorCpfUseCase {
  constructor(
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
  ) {}

  async executar(input: BuscarCompradorPorCpfInput): Promise<BuscarCompradorPorCpfOutput | null> {
    const cpfDigitos = input.cpf.replace(/\D/g, '');
    const comprador = await this.compradorRepository.buscarPorCpf(cpfDigitos);

    if (!comprador) {
      return null;
    }

    return {
      compradorId: comprador.id,
      nome: comprador.nome,
      telefone: comprador.telefone,
      endereco: comprador.endereco,
    };
  }
}
