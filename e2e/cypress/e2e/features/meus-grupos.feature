# language: pt

Funcionalidade: Meus grupos
  Como administrador
  Eu quero cadastrar e gerenciar meus grupos do WhatsApp dentro da plataforma
  Para organizar meus compradores e sorteios por grupo, e automatizar mensagens em cada um

  Contexto:
    Dado que o administrador "João" está autenticado e acessa o menu "Meus grupos"

  Cenário: Cadastrar um novo grupo
    Quando "João" cadastra um novo grupo com o nome "Sorteios da loja" e o identificador do grupo do WhatsApp
    E confirma o cadastro
    Então o grupo "Sorteios da loja" é criado e vinculado a "João"
    E fica disponível para gerar links de convite e cadastrar sorteios

  Cenário: Adicionar o agente chatbot a um grupo
    Dado que o grupo "Sorteios da loja" já está cadastrado, mas sem o agente chatbot ativo
    Quando "João" ativa o agente chatbot para esse grupo
    Então o agente passa a enviar mensagens automáticas nesse grupo do WhatsApp

  Cenário: Configurar quais mensagens automáticas o agente envia
    Dado que o agente chatbot está ativo no grupo "Sorteios da loja"
    Quando "João" seleciona quais tipos de mensagem o agente deve enviar (lembrete de cotas restantes, aviso de novo sorteio, resultado do sorteio)
    Então o agente passa a enviar apenas os tipos de mensagem selecionados

  Cenário: Desativar o agente chatbot de um grupo
    Dado que o agente chatbot está ativo no grupo "Sorteios da loja"
    Quando "João" desativa o agente chatbot desse grupo
    Então o agente para de enviar qualquer mensagem automática nesse grupo

  Cenário: Visualizar a lista de usuários de um grupo
    Dado que o grupo "Sorteios da loja" tem compradores cadastrados
    Quando "João" abre os detalhes desse grupo
    Então ele vê a lista de compradores vinculados a esse grupo, com nome e telefone de cada um

  Cenário: Visualizar quantos sorteios já foram realizados em um grupo
    Dado que o grupo "Sorteios da loja" já teve 3 sorteios finalizados e tem 1 sorteio com vendas abertas
    Quando "João" abre os detalhes desse grupo
    Então ele vê o total de sorteios já finalizados nesse grupo
    E vê o sorteio atualmente em andamento nesse grupo

  Cenário: Tentativa de cadastrar um grupo já vinculado ao WhatsApp de outro administrador
    Dado que o identificador de um grupo do WhatsApp já está vinculado ao administrador "Carlos"
    Quando "João" tenta cadastrar esse mesmo grupo do WhatsApp para si
    Então o sistema impede o cadastro
    E informa que esse grupo já está vinculado a outro administrador
