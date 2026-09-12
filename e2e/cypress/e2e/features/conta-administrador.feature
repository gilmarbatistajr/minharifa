# language: pt

Funcionalidade: Conta e perfil do administrador
  Como administrador
  Eu quero gerenciar meus próprios dados de conta
  Para manter minhas informações atualizadas e minha conta segura

  Contexto:
    Dado que o administrador "João" está autenticado e acessa a tela "Minha conta"

  Cenário: Visualizar os dados da conta
    Quando "João" abre a tela "Minha conta"
    Então ele vê seu nome e e-mail cadastrados

  Cenário: Atualizar o nome cadastrado
    Quando "João" altera seu nome para "João Pedro Silva"
    E salva a alteração
    Então o novo nome passa a ser exibido no painel

  Cenário: Alterar a senha informando a senha atual
    Quando "João" informa sua senha atual corretamente
    E define uma nova senha válida
    E confirma a alteração
    Então a senha é atualizada com sucesso
    E ele recebe uma notificação por e-mail avisando que a senha foi alterada

  Cenário: Tentativa de alterar a senha com a senha atual incorreta
    Quando "João" informa a senha atual de forma incorreta
    E tenta definir uma nova senha
    Então o sistema exibe um erro informando que a senha atual está incorreta
    E a senha não é alterada

  Cenário: Tentativa de alterar o e-mail de acesso
    Quando "João" tenta alterar o e-mail cadastrado na conta
    Então o sistema exige que ele confirme a alteração através de um link enviado ao e-mail atual
    E o e-mail só é efetivamente alterado depois dessa confirmação

  Cenário: Encerrar a sessão
    Quando "João" seleciona a opção "sair"
    Então sua sessão é encerrada
    E ele é redirecionado para a tela de login de administrador
