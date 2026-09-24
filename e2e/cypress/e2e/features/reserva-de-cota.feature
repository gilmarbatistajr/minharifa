# language: pt

Funcionalidade: Reserva de cota em um sorteio
  Como comprador
  Eu quero reservar o número da cota que escolhi
  Para garantir que ninguém mais compre esse número enquanto eu pago

  Contexto:
    Dado que existe um sorteio "iPhone 16" com 100 cotas
    E a cota número 42 está disponível

  Cenário: Reserva bem-sucedida de uma cota disponível
    Dado que o comprador "Maria" preencheu seus dados de cadastro
    Quando "Maria" escolhe a cota número 42
    Então a cota número 42 fica com status "reservada" para "Maria"
    E um cronômetro de 2 minutos é iniciado para essa reserva
    E "Maria" é redirecionada para a tela de pagamento

  Cenário: Tentativa de reservar uma cota já reservada por outro comprador
    Dado que a cota número 42 já está "reservada" para "Maria" há 30 segundos
    Quando o comprador "João" tenta escolher a cota número 42
    Então o sistema informa que a cota 42 não está mais disponível
    E a cota número 42 continua "reservada" para "Maria"

  Cenário: Expiração da reserva por falta de pagamento
    Dado que a cota número 42 está "reservada" para "Maria" há 2 minutos
    E o pagamento dessa reserva não foi confirmado
    Quando o cronômetro de reserva expira
    Então a cota número 42 volta ao status "disponível"
    E "Maria" é avisada de que o tempo para pagamento acabou

  Cenário: Alerta visual de tempo restante durante o pagamento
    Dado que "Maria" está na tela de pagamento com a cota 42 reservada
    Quando restam 30 segundos para a reserva expirar
    Então o sistema exibe um alerta visível avisando o tempo restante

  Cenário: Confirmação de pagamento dentro do prazo
    Dado que a cota número 42 está "reservada" para "Maria" há 1 minuto
    Quando o gateway de pagamento confirma o pagamento via webhook
    Então a cota número 42 muda de status para "paga"
    E o cronômetro de reserva é cancelado
    E "Maria" recebe a confirmação da compra

  Cenário: Última cota do sorteio é vendida
    Dado que restava apenas 1 cota disponível no sorteio "iPhone 16"
    Quando essa última cota é confirmada como "paga"
    Então o sorteio "iPhone 16" muda de status para "cotas esgotadas"
    E o sistema gera automaticamente um arquivo xlsx com as colunas "número da cota", "telefone do comprador" e "endereço"
