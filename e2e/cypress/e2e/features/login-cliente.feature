# language: pt

Funcionalidade: Login do cliente
  Como usuário cliente
  Eu quero acessar minha conta
  Para poder ver e comprar cotas dos sorteios que tenho acesso

  Cenário: Acesso via link de convite leva à página de login
    Dado que o cliente recebe um link de convite para participar de um sorteio
    Quando ele acessa o link
    Então ele é redirecionado para a página de login

  Cenário: Acesso direto ao site leva à página de login
    Dado que o cliente acessa o site diretamente pelo navegador, sem link de convite
    Quando a página carrega
    Então a página de login é exibida

  Cenário: Ir para a criação de usuário a partir do login
    Dado que o cliente está na página de login
    Quando ele seleciona a opção "criar usuário"
    Então ele é redirecionado para a página com o formulário de criação de usuário

  Esquema do Cenário: Login social
    Dado que o cliente está na página de login
    Quando ele seleciona a opção de login social
    Então o sistema exibe a opção de logar com "<provedor>"

    Exemplos:
      | provedor                          |
      | conta de e-mail logada no navegador (Google) |
      | iCloud (Sign in with Apple)       |
      | Facebook                          |

  Cenário: Login com e-mail e senha válidos
    Dado que o cliente já possui uma conta cadastrada com e-mail e senha
    Quando ele preenche e-mail e senha corretos
    E seleciona o botão "login"
    Então o login é efetuado com sucesso
    E ele é levado para a lista de sorteios que tem acesso

  Cenário: Login com senha incorreta
    Dado que o cliente já possui uma conta cadastrada
    Quando ele preenche o e-mail correto e uma senha incorreta
    E seleciona o botão "login"
    Então o sistema exibe um erro informando que e-mail ou senha estão incorretos
    E o login não é efetuado

  Cenário: Cliente logado acessa um sorteio pelo link
    Dado que o cliente está logado na aplicação
    Quando ele seleciona o link de um sorteio ao qual tem acesso
    Então ele é redirecionado para a página principal daquele sorteio

  Cenário: Solicitação de recuperação de senha
    Dado que o cliente está na página de login
    E possui uma conta cadastrada com o e-mail "cliente@email.com"
    Quando ele seleciona a opção "esqueci minha senha" e informa esse e-mail
    Então o sistema envia um link de redefinição de senha para "cliente@email.com"

  Cenário: Redefinição de senha através do link recebido por e-mail
    Dado que o cliente recebeu um link de redefinição de senha válido
    Quando ele acessa o link e define uma nova senha
    Então a senha é atualizada com sucesso
    E ele consegue fazer login com a nova senha

  Cenário: Tentativa de uso de um link de redefinição de senha expirado
    Dado que o link de redefinição de senha do cliente já expirou
    Quando ele tenta acessá-lo para definir uma nova senha
    Então o sistema informa que o link expirou
    E oferece a opção de solicitar um novo link
