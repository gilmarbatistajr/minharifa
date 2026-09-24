# language: pt

Funcionalidade: Cadastro do comprador
  Como visitante do site
  Eu quero me cadastrar informando meus dados
  Para poder comprar cotas de um sorteio

  Cenário: Cadastro bem-sucedido com todos os dados válidos
    Dado que o visitante está na tela de cadastro
    Quando ele informa nome "Maria Silva", apelido "Mari", data de nascimento "10/05/1990", telefone "(11) 91234-5678", CPF "123.456.789-09" e endereço completo
    E confirma o cadastro
    Então o cadastro é salvo com sucesso
    E ele pode prosseguir para a escolha da cota

  Esquema do Cenário: Tentativa de cadastro com campo obrigatório ausente
    Dado que o visitante está na tela de cadastro
    Quando ele tenta se cadastrar sem preencher "<campo>"
    Então o sistema exibe um erro informando que "<campo>" é obrigatório
    E o cadastro não é salvo

    Exemplos:
      | campo               |
      | nome                |
      | data de nascimento  |
      | telefone            |
      | CPF                 |
      | endereço            |

  Cenário: Tentativa de cadastro com CPF em formato inválido
    Dado que o visitante está na tela de cadastro
    Quando ele informa um CPF com menos de 11 dígitos
    Então o sistema exibe um erro informando que o CPF é inválido
    E o cadastro não é salvo

  Cenário: Tentativa de cadastro com CPF já utilizado por outro comprador
    Dado que já existe um comprador cadastrado com o CPF "123.456.789-09"
    Quando um novo visitante tenta se cadastrar com o mesmo CPF
    Então o sistema exibe um erro informando que esse CPF já está cadastrado
    E sugere que ele faça login em vez de um novo cadastro

  Cenário: Tentativa de cadastro com telefone em formato inválido
    Dado que o visitante está na tela de cadastro
    Quando ele informa um número de telefone com formato inválido
    Então o sistema exibe um erro informando que o telefone é inválido
    E o cadastro não é salvo

  Cenário: Tentativa de cadastro de menor de 18 anos
    Dado que o visitante está na tela de cadastro
    Quando ele informa uma data de nascimento que resulta em idade menor que 18 anos
    Então o sistema exibe um erro informando que é necessário ter 18 anos ou mais para participar
    E o cadastro não é salvo

  Cenário: Cadastro de maior de 18 anos no limite da idade mínima
    Dado que o visitante está na tela de cadastro
    Quando ele informa uma data de nascimento que resulta em exatamente 18 anos completos
    Então o cadastro é permitido normalmente

  Cenário: Cadastro exibe o termo de consentimento de retenção de dados
    Dado que o visitante preencheu todos os dados do formulário de cadastro
    Quando ele chega na etapa final do cadastro
    Então o sistema exibe o termo de consentimento sobre a retenção dos seus dados
    E a caixa de marcação de aceite não vem marcada por padrão

  Cenário: Tentativa de finalizar o cadastro sem aceitar o termo de consentimento
    Dado que o visitante preencheu todos os dados do formulário de cadastro
    Quando ele tenta confirmar o cadastro sem marcar o aceite do termo de consentimento
    Então o sistema impede a finalização do cadastro
    E informa que é necessário aceitar o termo para continuar

  Cenário: Cadastro concluído com o termo de consentimento aceito
    Dado que o visitante preencheu todos os dados do formulário de cadastro
    Quando ele marca o aceite do termo de consentimento
    E confirma o cadastro
    Então o cadastro é salvo com sucesso
    E fica registrado que o comprador aceitou o termo, com a data e hora do aceite

  Cenário: Comprador já cadastrado reutiliza seus dados em uma nova compra
    Dado que o comprador "Maria Silva" já está cadastrado no sistema
    Quando ela retorna ao site para comprar uma cota em um novo sorteio
    Então seus dados de cadastro são reaproveitados automaticamente
    E ela não precisa preencher o formulário novamente
