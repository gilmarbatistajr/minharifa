import { Comprador } from '../../domain/entities/comprador.entity';
import { CompradorRepository } from '../../domain/repositories/comprador.repository';
import { BuscarCompradorPorCpfUseCase } from './buscar-comprador-por-cpf.use-case';

describe('BuscarCompradorPorCpfUseCase', () => {
  function criarRepositorio(comprador: Comprador | null): CompradorRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorCpf: jest.fn().mockResolvedValue(comprador),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };
  }

  it('retorna os dados reaproveitáveis de um comprador já cadastrado', async () => {
    const comprador = new Comprador(
      'comprador-1',
      'grupo-1',
      'Maria Silva',
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      null,
      null,
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
    const useCase = new BuscarCompradorPorCpfUseCase(criarRepositorio(comprador));

    const resultado = await useCase.executar({ cpf: '123.456.789-09' });

    expect(resultado).toEqual({
      compradorId: 'comprador-1',
      nome: 'Maria Silva',
      telefone: '11912345678',
      endereco: 'Rua das Flores, 123',
    });
  });

  it('retorna null quando o CPF não está cadastrado', async () => {
    const useCase = new BuscarCompradorPorCpfUseCase(criarRepositorio(null));

    const resultado = await useCase.executar({ cpf: '000.000.000-00' });

    expect(resultado).toBeNull();
  });
});
