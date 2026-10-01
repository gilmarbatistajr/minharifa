# language: pt

Funcionalidade: Acesso ao site via link de convite do administrador
  Como administrador
  Eu quero gerar um link de convite para compartilhar no meu grupo do WhatsApp
  Para que apenas as pessoas do meu grupo possam se cadastrar e comprar cotas dos meus sorteios

  Contexto:
    Dado que existe um administrador "João" cadastrado no sistema
    E "João" cadastrou o grupo "Sorteios da loja" em "Meus grupos"

  Cenário: Administrador gera um link de convite para um grupo específico
    Dado que "João" está autenticado como administrador
    Quando ele solicita a geração de um novo link de convite para o grupo "Sorteios da loja"
    Então o sistema gera um código único de convite vinculado a esse grupo
    E disponibiliza uma URL para ele compartilhar no WhatsApp desse grupo

  Cenário: Cadastro de comprador usando um link de convite válido
    Dado que "João" gerou um link de convite com código "ABC123" para o grupo "Sorteios da loja"
    Quando um visitante acessa o site pelo link com o código "ABC123"
    E preenche o formulário de cadastro de comprador
    Então o comprador é cadastrado e vinculado ao grupo "Sorteios da loja"
    E passa a enxergar apenas os sorteios realizados nesse grupo

  Cenário: Tentativa de acesso com um código de convite inexistente
    Dado que o código "XYZ999" nunca foi gerado por nenhum administrador
    Quando um visitante acessa o site com o código "XYZ999"
    Então o sistema informa que o link de convite é inválido
    E não permite o cadastro

  Cenário: Tentativa de uso de um link de convite revogado
    Dado que "João" revogou o link de convite com código "ABC123"
    Quando um visitante tenta se cadastrar usando o código "ABC123"
    Então o sistema informa que o link não está mais ativo
    E não permite o cadastro

  Cenário: Comprador vinculado a um grupo não enxerga sorteios de outro grupo
    Dado que o comprador "Maria" está vinculada ao grupo "Sorteios da loja" de "João"
    E existe um sorteio "Notebook" realizado no grupo "Outra loja", do administrador "Carlos"
    Quando "Maria" acessa a lista de sorteios disponíveis
    Então o sorteio "Notebook" não aparece para ela
    E apenas os sorteios do grupo "Sorteios da loja" são exibidos

  Cenário: Comprador vinculado a um grupo não enxerga sorteios de outro grupo do mesmo administrador
    Dado que "João" tem dois grupos: "Sorteios da loja" e "Clientes VIP"
    E o comprador "Pedro" está vinculado apenas ao grupo "Clientes VIP"
    E existe um sorteio "Smart TV" realizado no grupo "Sorteios da loja"
    Quando "Pedro" acessa a lista de sorteios disponíveis
    Então o sorteio "Smart TV" não aparece para ele
    E apenas os sorteios do grupo "Clientes VIP" são exibidos

  Cenário: Acesso ao site sem link de convite
    Dado que um visitante acessa o site diretamente, sem nenhum código de convite
    Quando ele navega pela página pública
    Então ele consegue ver que o site existe e do que se trata
    E não consegue ver sorteios específicos nem se cadastrar como comprador
