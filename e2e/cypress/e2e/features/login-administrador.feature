# language: pt

Funcionalidade: Login e cadastro do administrador
  Como usuário administrador
  Eu quero ter uma forma própria de acessar o sistema
  Para criar e gerenciar meus sorteios, sem depender de um link de convite de ninguém

  Cenário: Acesso à área de administrador
    Dado que um visitante acessa a página de login do site
    Quando ele seleciona a opção "sou administrador"
    Então ele é direcionado para a tela de login de administrador, distinta da tela de login do cliente

  Cenário: Cadastro de um novo administrador
    Dado que o visitante está na tela de cadastro de administrador
    Quando ele informa nome, e-mail e senha
    E confirma o cadastro
    Então a conta de administrador é criada com sucesso
    E ele é redirecionado para o painel administrativo, sem nenhum sorteio cadastrado ainda

  Cenário: Confirmação de e-mail antes de liberar a criação de sorteios
    Dado que um administrador acabou de se cadastrar
    Quando ele tenta criar um sorteio ou gerar um link de convite antes de confirmar o e-mail
    Então o sistema bloqueia a ação
    E informa que é necessário confirmar o e-mail primeiro

  Cenário: Login de administrador com e-mail e senha válidos
    Dado que já existe um administrador cadastrado com e-mail e senha confirmados
    Quando ele preenche e-mail e senha corretos na tela de login de administrador
    E seleciona o botão "login"
    Então o login é efetuado com sucesso
    E ele é levado ao painel administrativo com a lista dos seus sorteios

  Cenário: Recuperação de senha do administrador
    Dado que o administrador está na tela de login de administrador
    Quando ele seleciona "esqueci minha senha" e informa seu e-mail cadastrado
    Então o sistema envia um link de redefinição de senha para esse e-mail
    E o fluxo de redefinição segue o mesmo mecanismo usado para o cliente

  Cenário: Administrador tenta acessar a área de cliente com sua conta
    Dado que um usuário está autenticado como administrador
    Quando ele tenta acessar diretamente uma página de compra de cota
    Então o sistema o impede de comprar cotas com a conta de administrador
    E informa que essa ação é exclusiva para contas de cliente

  Cenário: Cliente tenta acessar o painel administrativo
    Dado que um usuário está autenticado como cliente
    Quando ele tenta acessar diretamente a URL do painel administrativo
    Então o sistema nega o acesso
    E o redireciona de volta para a área de cliente
