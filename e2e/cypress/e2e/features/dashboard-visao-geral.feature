# language: pt

Funcionalidade: Visão geral do painel administrativo
  Como administrador
  Eu quero ver um resumo do meu negócio assim que entro no painel
  Para entender rapidamente como estão meus sorteios sem precisar abrir cada um

  Contexto:
    Dado que o administrador "João" está autenticado e acessa o painel administrativo

  Cenário: Visão geral com sorteios ativos
    Dado que "João" tem 2 sorteios com vendas abertas e 1 sorteio com cotas esgotadas
    Quando ele acessa a tela de visão geral
    Então ele vê o total de sorteios ativos
    E vê o total arrecadado somando todos os sorteios
    E vê a porcentagem de cotas vendidas de cada sorteio ativo

  Cenário: Visão geral sem nenhum sorteio cadastrado
    Dado que "João" ainda não cadastrou nenhum sorteio
    Quando ele acessa a tela de visão geral
    Então o sistema exibe uma mensagem convidando-o a cadastrar seu primeiro prêmio e sorteio
    E não exibe nenhum KPI numérico vazio ou quebrado

  Cenário: Atalho para o sorteio com vendas encerrando em breve
    Dado que "João" tem um sorteio cuja data de encerramento de vendas é nas próximas 24 horas
    Quando ele acessa a tela de visão geral
    Então esse sorteio aparece destacado como "encerrando em breve"
    E um clique nele leva direto aos detalhes desse sorteio

  Cenário: Atalho para sorteio pronto para registrar resultado
    Dado que "João" tem um sorteio com status "cotas esgotadas" sem vencedor registrado
    Quando ele acessa a tela de visão geral
    Então esse sorteio aparece destacado como "aguardando resultado"
    E um clique nele leva direto à tela de registrar o vencedor
