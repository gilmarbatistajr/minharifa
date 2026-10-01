# language: pt

Funcionalidade: Cancelamento de um sorteio
  Como administrador
  Eu quero poder cancelar um sorteio em andamento
  Para lidar com imprevistos sem prejudicar os compradores que já pagaram

  Como comprador
  Eu quero escolher o que acontece com o dinheiro que já paguei
  Para não perder o valor investido em cotas de um sorteio cancelado

  Contexto:
    Dado que existe um sorteio "iPhone 16 Pro" com vendas abertas
    E o comprador "Maria" tem 3 cotas pagas nesse sorteio

  Cenário: Administrador cancela um sorteio com vendas em andamento
    Dado que o administrador "João" está nos detalhes do sorteio "iPhone 16 Pro"
    Quando ele confirma o cancelamento desse sorteio
    Então o sorteio muda para o status "cancelado"
    E nenhuma nova cota pode ser reservada ou paga nesse sorteio
    E todos os compradores com cotas pagas são notificados sobre o cancelamento

  Cenário: Cancelamento libera automaticamente as cotas apenas reservadas (não pagas)
    Dado que existe uma cota reservada, mas ainda não paga, no sorteio "iPhone 16 Pro"
    Quando o administrador cancela esse sorteio
    Então essa cota é liberada sem necessidade de nenhuma ação do comprador

  Cenário: Comprador escolhe reembolso do valor investido
    Dado que "Maria" foi notificada do cancelamento do sorteio "iPhone 16 Pro"
    Quando ela escolhe a opção de reembolso
    Então o valor pago pelas 3 cotas é estornado para o método de pagamento original de "Maria"
    E suas cotas nesse sorteio ficam com status "cancelada e reembolsada"

  Cenário: Comprador escolhe manter a quantidade de cotas para o próximo sorteio
    Dado que "Maria" foi notificada do cancelamento do sorteio "iPhone 16 Pro"
    E existe um próximo sorteio "iPhone 16 Pro (relançamento)" no mesmo grupo
    Quando ela escolhe manter suas cotas para o próximo sorteio
    Então o sistema reserva para "Maria" a mesma quantidade de cotas (3) nesse próximo sorteio, sem cobrança adicional
    E ela pode escolher os números dessas cotas dentro das disponíveis nesse novo sorteio

  Cenário: Ainda não existe um próximo sorteio no momento da escolha
    Dado que "Maria" foi notificada do cancelamento do sorteio "iPhone 16 Pro"
    E o administrador ainda não cadastrou um sorteio seguinte nesse grupo
    Quando ela tenta escolher a opção de manter as cotas para o próximo sorteio
    Então o sistema informa que essa opção ficará disponível assim que um novo sorteio for cadastrado nesse grupo
    E guarda o crédito de 3 cotas pendente para quando isso acontecer

  Cenário: Comprador não se manifesta dentro do prazo definido
    Dado que "Maria" foi notificada do cancelamento e tem um prazo para escolher uma das opções
    Quando esse prazo expira sem que ela escolha nada
    Então o valor investido fica guardado como cashback na conta de "Maria"
    E ela pode usar esse cashback para investir no próximo sorteio que ela escolher, de qualquer grupo ao qual tenha acesso
