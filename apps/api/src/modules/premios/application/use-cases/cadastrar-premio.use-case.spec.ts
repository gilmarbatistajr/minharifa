import { PremioRepository } from '../../domain/repositories/premio.repository';
import { Premio } from '../../domain/entities/premio.entity';
import { CadastrarPremioUseCase } from './cadastrar-premio.use-case';

describe('CadastrarPremioUseCase', () => {
  function criarRepositorio(): PremioRepository {
    return {
      buscarPorId: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };
  }

  it('cadastra um prêmio com todos os dados obrigatórios', async () => {
    const repositorio = criarRepositorio();
    const useCase = new CadastrarPremioUseCase(repositorio);

    const resultado = await useCase.executar({
      administradorId: 'admin-1',
      nome: 'iPhone 16 Pro',
      descricao: 'Um belo iPhone',
      fotoUrl: 'https://exemplo.com/foto.png',
      valor: 8000,
    });

    expect(resultado.premioId).toBeDefined();
    const premioCriado = (repositorio.criar as jest.Mock).mock.calls[0][0] as Premio;
    expect(premioCriado.valorOpcaoDinheiro).toBeNull();
  });

  it('cadastra um prêmio com opção de troca por dinheiro', async () => {
    const repositorio = criarRepositorio();
    const useCase = new CadastrarPremioUseCase(repositorio);

    await useCase.executar({
      administradorId: 'admin-1',
      nome: 'iPhone 16 Pro',
      descricao: 'Um belo iPhone',
      fotoUrl: 'https://exemplo.com/foto.png',
      valor: 8000,
      valorOpcaoDinheiro: 7800,
    });

    const premioCriado = (repositorio.criar as jest.Mock).mock.calls[0][0] as Premio;
    expect(premioCriado.valorOpcaoDinheiro).toBe(7800);
  });

  it('rejeita valor inválido (menor ou igual a zero)', async () => {
    const repositorio = criarRepositorio();
    const useCase = new CadastrarPremioUseCase(repositorio);

    await expect(
      useCase.executar({
        administradorId: 'admin-1',
        nome: 'iPhone 16 Pro',
        descricao: 'Um belo iPhone',
        fotoUrl: 'https://exemplo.com/foto.png',
        valor: -100,
      }),
    ).rejects.toThrow('maior que zero');
    expect(repositorio.criar).not.toHaveBeenCalled();
  });
});
