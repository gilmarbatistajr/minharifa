# language: pt

Funcionalidade: Cadastro de prêmio
  Como administrador do site
  Eu quero cadastrar um item como prêmio de um sorteio
  Para que ele possa ser vinculado a um sorteio futuro

  Cenário: Cadastro de prêmio com todos os dados obrigatórios
    Dado que o administrador está na tela de cadastro de prêmio
    Quando ele informa nome "iPhone 16 Pro", descrição, uma foto e valor "8000.00"
    E confirma o cadastro
    Então o prêmio "iPhone 16 Pro" é salvo com sucesso
    E fica disponível para ser vinculado a um sorteio

  Esquema do Cenário: Tentativa de cadastro com campo obrigatório ausente
    Dado que o administrador está na tela de cadastro de prêmio
    Quando ele tenta cadastrar um prêmio sem preencher "<campo>"
    Então o sistema exibe um erro informando que "<campo>" é obrigatório
    E o prêmio não é salvo

    Exemplos:
      | campo       |
      | nome        |
      | descrição   |
      | foto        |
      | valor       |

  Cenário: Tentativa de cadastro com valor inválido
    Dado que o administrador está na tela de cadastro de prêmio
    Quando ele informa o valor do prêmio como "-100.00"
    Então o sistema exibe um erro informando que o valor deve ser maior que zero
    E o prêmio não é salvo

  Cenário: Cadastro do valor alternativo em dinheiro
    Dado que o administrador está cadastrando o prêmio "iPhone 16 Pro"
    Quando ele informa um valor de "7800.00" como opção de troca por dinheiro via Pix
    E confirma o cadastro
    Então o prêmio é salvo com a opção de troca por dinheiro habilitada
    E o vencedor poderá escolher entre receber o prêmio físico ou esse valor via Pix

  Cenário: Cadastro de prêmio sem oferecer a opção de troca por dinheiro
    Dado que o administrador está cadastrando um prêmio
    Quando ele não preenche o valor de troca por dinheiro
    E confirma o cadastro
    Então o prêmio é salvo sem a opção de troca por dinheiro
    E o vencedor só poderá receber o prêmio físico

  Cenário: Edição de um prêmio ainda não vinculado a um sorteio
    Dado que existe um prêmio "iPhone 16 Pro" cadastrado e não vinculado a nenhum sorteio
    Quando o administrador atualiza o valor para "7500.00"
    Então o prêmio passa a exibir o novo valor "7500.00"

  Cenário: Tentativa de edição de um prêmio já vinculado a um sorteio em andamento
    Dado que existe um prêmio "iPhone 16 Pro" vinculado a um sorteio com vendas abertas
    Quando o administrador tenta alterar o valor desse prêmio
    Então o sistema impede a alteração
    E informa que o prêmio não pode ser editado enquanto o sorteio estiver em andamento
