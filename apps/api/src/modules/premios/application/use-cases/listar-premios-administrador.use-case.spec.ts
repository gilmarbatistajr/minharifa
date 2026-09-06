import { Premio } from '../../domain/entities/premio.entity';
import { PremioRepository } from '../../domain/repositories/premio.repository';
import { ListarPremiosDoAdministradorUseCase } from './listar-premios-administrador.use-case';

describe('ListarPremiosDoAdministradorUseCase', () => {
  it('retorna os prêmios do administrador autenticado', async () => {
    const premios = [
      new Premio('premio-1', 'admin-1', 'iPhone 16 Pro', 'desc', 'foto.png', 8000, null, new Date()),
    ];
    const repositorio: PremioRepository = {
      buscarPorId: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(premios),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const useCase = new ListarPremiosDoAdministradorUseCase(repositorio);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toBe(premios);
  });
});
