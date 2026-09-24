import { Comprador } from '../../domain/entities/comprador.entity';
import { CompradorRepository } from '../../domain/repositories/comprador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { CadastrarCompradorUseCase } from './cadastrar-comprador.use-case';

describe('CadastrarCompradorUseCase', () => {
  function criarDependencias(existentePorCpf: Comprador | null = null) {
    const repositorio: CompradorRepository = {
      buscarPorId: jest.fn(),
      buscarPorCpf: jest.fn().mockResolvedValue(existentePorCpf),
      buscarPorEmail: jest.fn().mockResolvedValue(null),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
    };
    const passwordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hash-da-senha'),
      comparar: jest.fn(),
    };

    return { repositorio, passwordHasher };
  }

  const inputValido = {
    grupoId: 'grupo-1',
    nome: 'Maria Silva',
    apelido: 'Mari',
    dataNascimento: new Date('1990-05-10'),
    telefone: '(11) 91234-5678',
    cpf: '123.456.789-09',
    endereco: 'Rua das Flores, 123',
    email: 'maria@example.com',
    senha: 'senha-forte',
    aceitouTermo: true,
  };

  it('cadastra um comprador com todos os dados válidos', async () => {
    const { repositorio, passwordHasher } = criarDependencias();
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    const resultado = await useCase.executar(inputValido, new Date('2026-06-01'));

    expect(resultado.compradorId).toBeDefined();
    expect(repositorio.criar).toHaveBeenCalled();
  });

  it('rejeita cadastro sem aceite do termo de consentimento', async () => {
    const { repositorio, passwordHasher } = criarDependencias();
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({ ...inputValido, aceitouTermo: false }, new Date('2026-06-01')),
    ).rejects.toThrow('aceitar o termo de consentimento');
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('rejeita CPF em formato inválido', async () => {
    const { repositorio, passwordHasher } = criarDependencias();
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({ ...inputValido, cpf: '123.456.789' }, new Date('2026-06-01')),
    ).rejects.toThrow('CPF inválido.');
  });

  it('rejeita telefone em formato inválido', async () => {
    const { repositorio, passwordHasher } = criarDependencias();
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({ ...inputValido, telefone: '123' }, new Date('2026-06-01')),
    ).rejects.toThrow('Telefone inválido.');
  });

  it('rejeita cadastro de menor de 18 anos', async () => {
    const { repositorio, passwordHasher } = criarDependencias();
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar(
        { ...inputValido, dataNascimento: new Date('2010-01-01') },
        new Date('2026-06-01'),
      ),
    ).rejects.toThrow('18 anos ou mais');
  });

  it('permite cadastro de quem completa exatamente 18 anos na data', async () => {
    const { repositorio, passwordHasher } = criarDependencias();
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar(
        { ...inputValido, dataNascimento: new Date('2008-06-01') },
        new Date('2026-06-01'),
      ),
    ).resolves.toBeDefined();
  });

  it('rejeita CPF já cadastrado, sugerindo login', async () => {
    const existente = new Comprador(
      'comprador-existente',
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
    const { repositorio, passwordHasher } = criarDependencias(existente);
    const useCase = new CadastrarCompradorUseCase(repositorio, passwordHasher);

    await expect(useCase.executar(inputValido, new Date('2026-06-01'))).rejects.toThrow(
      'Faça login',
    );
  });
});
