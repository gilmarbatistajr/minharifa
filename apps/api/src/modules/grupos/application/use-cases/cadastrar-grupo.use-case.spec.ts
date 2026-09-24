import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { LinkConviteRepository } from '../../domain/repositories/link-convite.repository';
import { TokenGenerator } from '../../../../shared/domain/token-generator';
import { CadastrarGrupoUseCase } from './cadastrar-grupo.use-case';

describe('CadastrarGrupoUseCase', () => {
  function criarDependencias(existente: Grupo | null) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn().mockResolvedValue(existente),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
    };
    const linkConviteRepository: LinkConviteRepository = {
      buscarPorId: jest.fn(),
      buscarPorCodigo: jest.fn(),
      buscarAtivoPorGrupo: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };
    const tokenGenerator: TokenGenerator = {
      gerar: jest.fn().mockReturnValue('codigolongoaleatorio'),
    };

    return { grupoRepository, linkConviteRepository, tokenGenerator };
  }

  it('cadastra um novo grupo para o administrador já com um link de convite ativo', async () => {
    const { grupoRepository, linkConviteRepository, tokenGenerator } = criarDependencias(null);
    const useCase = new CadastrarGrupoUseCase(grupoRepository, linkConviteRepository, tokenGenerator);

    const resultado = await useCase.executar({
      administradorId: 'admin-1',
      nome: 'Amigos do bem',
      identificadorWhatsapp: '5511999999999',
      linkWhatsapp: 'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv',
    });

    expect(resultado.grupoId).toBeDefined();
    expect(resultado.codigoConvite).toBe('codigolong');
    expect(grupoRepository.criar).toHaveBeenCalled();
    expect(linkConviteRepository.criar).toHaveBeenCalled();
    const grupoCriado = (grupoRepository.criar as jest.Mock).mock.calls[0][0] as Grupo;
    expect(grupoCriado.linkWhatsapp).toBe('https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv');
  });

  it('rejeita quando o grupo do WhatsApp já está vinculado a outro administrador', async () => {
    const existente = new Grupo('grupo-1', 'admin-2', 'Outro grupo', '5511999999999', new Date());
    const { grupoRepository, linkConviteRepository, tokenGenerator } = criarDependencias(existente);
    const useCase = new CadastrarGrupoUseCase(grupoRepository, linkConviteRepository, tokenGenerator);

    await expect(
      useCase.executar({
        administradorId: 'admin-1',
        nome: 'Amigos do bem',
        identificadorWhatsapp: '5511999999999',
        linkWhatsapp: 'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv',
      }),
    ).rejects.toThrow('já está vinculado a outro administrador');
    expect(linkConviteRepository.criar).not.toHaveBeenCalled();
  });
});
