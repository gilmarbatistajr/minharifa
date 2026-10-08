# language: pt

Funcionalidade: Pagamento da cota reservada
  Como comprador
  Eu quero pagar pela cota que reservei, via Pix ou cartão de crédito
  Para confirmar minha compra antes que a reserva expire

  Contexto:
    Dado que o comprador "Maria" reservou a cota número 42 do sorteio "iPhone 16 Pro"
    E o valor da cota é "R$ 50,00"

  Cenário: Geração de cobrança via Pix
    Quando "Maria" escolhe pagar via Pix
    Então o sistema gera um QR Code e um código "copia e cola" no valor de "R$ 50,00"
    E o QR Code fica válido pelo tempo restante da reserva da cota

  Cenário: Confirmação de pagamento via Pix dentro do prazo
    Dado que "Maria" gerou a cobrança Pix da cota 42 há 1 minuto
    Quando o gateway de pagamento confirma o pagamento via webhook
    Então a cota número 42 muda de status para "paga"
    E o cronômetro de reserva é cancelado
    E "Maria" recebe a confirmação da compra

  Cenário: Geração de cobrança via cartão de crédito
    Quando "Maria" escolhe pagar via cartão de crédito
    E informa os dados do cartão (número, validade, CVV e nome do titular)
    E confirma o pagamento
    Então o sistema envia a cobrança para o gateway de pagamento
    E aguarda a resposta de aprovação

  Cenário: Cartão de crédito aprovado dentro do prazo
    Dado que "Maria" enviou os dados do cartão para pagar a cota 42
    Quando o gateway aprova a transação
    Então a cota número 42 muda de status para "paga" imediatamente
    E "Maria" recebe a confirmação da compra

  Cenário: Cartão de crédito recusado
    Dado que "Maria" enviou os dados do cartão para pagar a cota 42
    Quando o gateway recusa a transação
    Então o sistema informa que o pagamento não foi aprovado
    E a cota número 42 continua "reservada" para "Maria", enquanto ainda houver tempo de reserva
    E ela pode tentar novamente com outro método antes da reserva expirar

  Cenário: Pagamento confirmado depois que a reserva já expirou (webhook tardio)
    Dado que a reserva da cota 42 de "Maria" já expirou e a cota voltou a ficar "disponível"
    Quando o gateway de pagamento confirma esse pagamento atrasado via webhook
    Então o sistema estorna automaticamente o valor pago
    E a cota número 42 permanece com o status que tinha no momento (disponível ou vendida a outra pessoa)
    E "Maria" é notificada do estorno e do motivo

  Cenário: Falha na comunicação com o gateway de pagamento
    Quando "Maria" tenta gerar uma cobrança e o gateway de pagamento está indisponível
    Então o sistema informa que não foi possível processar o pagamento no momento
    E orienta "Maria" a tentar novamente
    E a reserva da cota 42 não é cancelada só por causa dessa falha

  Cenário: Pagamento de uma cota usando cashback disponível
    Dado que "Maria" tem "R$ 50,00" de cashback disponível na sua conta
    E ela reservou uma cota de "R$ 50,00" em um novo sorteio
    Quando ela escolhe pagar essa cota usando o cashback
    Então o valor do cashback é debitado da sua conta
    E a cota é confirmada como "paga", sem necessidade de Pix ou cartão

  Cenário: Cashback insuficiente para cobrir o valor total da cota
    Dado que "Maria" tem "R$ 20,00" de cashback disponível
    E ela reservou uma cota de "R$ 50,00"
    Quando ela escolhe usar o cashback disponível
    Então o sistema abate os "R$ 20,00" do valor da cota
    E solicita o pagamento dos "R$ 30,00" restantes via Pix ou cartão de crédito

  Cenário: Validação de assinatura do webhook de pagamento
    Dado que a aplicação recebe uma notificação de pagamento
    Quando a assinatura dessa notificação não é válida
    Então o sistema rejeita a notificação
    E não altera o status de nenhuma cota com base nela

  Cenário: Reserva não pode ser paga parcialmente
    Dado que "Maria" reservou as cotas 10, 11 e 12 do mesmo sorteio
    Quando ela tenta pagar apenas a cota 10, deixando as cotas 11 e 12 de fora
    Então o sistema recusa o pagamento
    E orienta "Maria" a pagar todas as cotas reservadas de uma só vez
    E nenhuma das três cotas muda de status

  Cenário: Pagamento de um lote de cotas reservadas numa única transação
    Dado que "Maria" reservou as cotas 10, 11 e 12 do mesmo sorteio, de "R$ 50,00" cada
    Quando ela escolhe pagar via Pix informando as três cotas
    Então o sistema gera um único QR Code no valor de "R$ 150,00"
    E, quando o pagamento é confirmado, as cotas 10, 11 e 12 mudam para "paga" juntas
