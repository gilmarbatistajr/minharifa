# language: pt

Funcionalidade: Cadastro de sorteio
  Como administrador do site
  Eu quero cadastrar um sorteio vinculado a um prêmio
  Para abrir a venda de cotas para os compradores

  Contexto:
    Dado que existe um prêmio "iPhone 16 Pro" cadastrado e disponível

  Cenário: Cadastro de sorteio com datas e quantidade de cotas válidas
    Dado que o administrador está na tela de cadastro de sorteio
    Quando ele vincula o prêmio "iPhone 16 Pro"
    E define data de abertura de vendas "01/10/2026", data de encerramento "31/10/2026", data de realização "05/11/2026" e quantidade de cotas "100"
    E confirma o cadastro
    Então o sorteio é salvo com status "aguardando abertura"
    E fica programado para abrir as vendas na data definida

  Cenário: Abertura automática das vendas na data programada
    Dado que existe um sorteio com status "aguardando abertura" e data de abertura de vendas hoje
    Quando o sistema processa a virada do dia
    Então o sorteio muda para status "vendas abertas"
    E as cotas ficam disponíveis para reserva

  Cenário: Encerramento automático das vendas na data programada
    Dado que existe um sorteio com status "vendas abertas" e data de encerramento de vendas hoje
    Quando o sistema processa a virada do dia
    Então o sorteio muda para status "vendas encerradas"
    E nenhuma nova cota pode ser reservada

  Cenário: Tentativa de cadastro com data de encerramento anterior à de abertura
    Dado que o administrador está na tela de cadastro de sorteio
    Quando ele define a data de encerramento de vendas antes da data de abertura de vendas
    Então o sistema exibe um erro informando que a data de encerramento deve ser posterior à de abertura
    E o sorteio não é salvo

  Cenário: Tentativa de cadastro com data de realização anterior ao encerramento das vendas
    Dado que o administrador está na tela de cadastro de sorteio
    Quando ele define a data de realização do sorteio antes da data de encerramento de vendas
    Então o sistema exibe um erro informando que a realização deve ocorrer após o encerramento das vendas
    E o sorteio não é salvo

  Cenário: Tentativa de cadastro com quantidade de cotas inválida
    Dado que o administrador está na tela de cadastro de sorteio
    Quando ele define a quantidade de cotas como "0"
    Então o sistema exibe um erro informando que a quantidade de cotas deve ser maior que zero
    E o sorteio não é salvo

  Cenário: Tentativa de vincular um prêmio já usado em outro sorteio ativo
    Dado que o prêmio "iPhone 16 Pro" já está vinculado a um sorteio com status "vendas abertas"
    Quando o administrador tenta cadastrar um novo sorteio com esse mesmo prêmio
    Então o sistema impede o cadastro
    E informa que o prêmio já está vinculado a um sorteio ativo
