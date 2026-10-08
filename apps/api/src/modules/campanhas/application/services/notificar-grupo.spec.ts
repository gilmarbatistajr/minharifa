import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { notificarGrupo } from './notificar-grupo';

describe('notificarGrupo', () => {
  function criarDependencias(compradores: { id: string; nome: string; telefone: string }[]) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn().mockResolvedValue(compradores),
      criar: jest.fn(),
    };
    const notificationSender: NotificationSender = {
      enviarEmail: jest.fn(),
      enviarWhatsapp: jest.fn().mockResolvedValue(undefined),
    };

    return { grupoRepository, notificationSender };
  }

  it('envia a mensagem para o telefone de cada comprador do grupo', async () => {
    const compradores = [
      { id: 'comprador-1', nome: 'Maria', telefone: '11988887777' },
      { id: 'comprador-2', nome: 'João', telefone: '11977776666' },
    ];
    const { grupoRepository, notificationSender } = criarDependencias(compradores);

    await notificarGrupo(grupoRepository, notificationSender, 'grupo-1', 'Metade das cotas já foi vendida!');

    expect(grupoRepository.listarCompradores).toHaveBeenCalledWith('grupo-1');
    expect(notificationSender.enviarWhatsapp).toHaveBeenCalledTimes(2);
    expect(notificationSender.enviarWhatsapp).toHaveBeenCalledWith(
      '11988887777',
      'Metade das cotas já foi vendida!',
    );
    expect(notificationSender.enviarWhatsapp).toHaveBeenCalledWith(
      '11977776666',
      'Metade das cotas já foi vendida!',
    );
  });

  it('não falha quando o envio para um comprador dá erro — os demais continuam recebendo', async () => {
    const compradores = [
      { id: 'comprador-1', nome: 'Maria', telefone: '11988887777' },
      { id: 'comprador-2', nome: 'João', telefone: '11977776666' },
    ];
    const { grupoRepository, notificationSender } = criarDependencias(compradores);
    (notificationSender.enviarWhatsapp as jest.Mock)
      .mockRejectedValueOnce(new Error('falha no envio'))
      .mockResolvedValueOnce(undefined);

    await expect(notificarGrupo(grupoRepository, notificationSender, 'grupo-1', 'Aviso')).resolves.toBeUndefined();
    expect(notificationSender.enviarWhatsapp).toHaveBeenCalledTimes(2);
  });

  it('não envia nada quando o grupo não tem compradores', async () => {
    const { grupoRepository, notificationSender } = criarDependencias([]);

    await notificarGrupo(grupoRepository, notificationSender, 'grupo-1', 'Aviso');

    expect(notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
  });
});
