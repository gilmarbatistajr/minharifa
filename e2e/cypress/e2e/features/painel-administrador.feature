# language: pt

Funcionalidade: Painel de gestão do administrador
  Como usuário administrador
  Eu quero acompanhar e gerenciar meus sorteios em um só lugar
  Para ter controle total sobre prêmios, cotas vendidas, compradores e resultados

  Contexto:
    Dado que o administrador "João" está autenticado no painel administrativo

  Cenário: Visualizar a lista de sorteios cadastrados
    Quando "João" acessa o painel administrativo
    Então ele vê a lista de todos os seus sorteios com status (aguardando abertura, vendas abertas, vendas encerradas, cotas esgotadas, finalizado)

  Cenário: Visualizar as cotas vendidas de um sorteio específico
    Dado que existe um sorteio "iPhone 16 Pro" com algumas cotas vendidas e outras disponíveis
    Quando "João" abre os detalhes desse sorteio
    Então ele vê o mapa de cotas, indicando quais estão disponíveis, reservadas e pagas
    E vê o total arrecadado até o momento

  Cenário: Visualizar os dados dos compradores de um sorteio
    Quando "João" abre a lista de compradores de um sorteio
    Então ele vê, para cada cota paga, o nome, telefone e número da cota do comprador

  Cenário: Baixar o arquivo xlsx gerado ao final das vendas
    Dado que o sorteio "iPhone 16 Pro" teve todas as cotas vendidas
    Quando "João" acessa os detalhes desse sorteio
    Então ele encontra disponível para download o arquivo xlsx gerado automaticamente

  Cenário: Registrar o resultado do sorteio
    Dado que o sorteio "iPhone 16 Pro" está com status "cotas esgotadas" e o sorteio já foi realizado externamente
    Quando "João" informa qual número de cota foi o vencedor
    Então o sistema registra o comprador vinculado a essa cota como vencedor
    E o sorteio muda para status "finalizado"

  Cenário: Registrar a escolha do vencedor entre prêmio físico ou dinheiro
    Dado que o sorteio "iPhone 16 Pro" tem a opção de troca por dinheiro habilitada
    E o vencedor já foi registrado
    Quando "João" registra que o vencedor optou por receber o valor em dinheiro via Pix
    Então o sistema marca essa escolha no registro do vencedor
    E exibe o valor a ser transferido para o vencedor

  Cenário: Ranking de vencedores
    Dado que "João" já finalizou mais de um sorteio com vencedores registrados
    Quando ele acessa a seção de ranking de vencedores
    Então ele vê a lista de vencedores de todos os seus sorteios já finalizados

  Cenário: Gerenciar links de convite ativos
    Quando "João" acessa a seção de links de convite
    Então ele vê todos os links já gerados, com status (ativo ou revogado) e quantos compradores se cadastraram por cada um

  Cenário: Tentativa de finalizar um sorteio que ainda tem cotas disponíveis
    Dado que o sorteio "Notebook" ainda tem cotas disponíveis para venda
    Quando "João" tenta registrar o resultado desse sorteio
    Então o sistema impede a ação
    E informa que o sorteio só pode ser finalizado depois que todas as cotas forem vendidas
