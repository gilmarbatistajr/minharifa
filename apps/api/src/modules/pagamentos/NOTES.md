# Módulo: pagamentos

Implementado seguindo o padrão do módulo `sorteios`. Este foi o módulo com mais decisões de
design não triviais — documentadas abaixo para quem for evoluir o fluxo.

## Cobertura por feature

- `pagamento-de-cota.feature`: cobrança Pix, pagamento com cartão (síncrono: gera a cobrança e já
  aplica aprovação/recusa, cobrindo os 3 cenários "geração"/"aprovado"/"recusado" em um único caso
  de uso), pagamento com cashback (total ou parcial, abatendo e informando o valor restante),
  confirmação via webhook (com validação de assinatura HMAC e estorno automático de webhook tardio).
- `cancelamento-de-sorteio.feature` (parte de reembolso/cashback, conforme escopo original do
  módulo): cancelar sorteio libera cotas reservadas e cria uma `EscolhaPosCancelamento` por
  comprador com cotas pagas; reembolso estorna e marca `CANCELADA_REEMBOLSADA`; manter cotas gera
  um `CreditoPendente` (funciona tanto se já existe quanto se não existe ainda um próximo sorteio —
  ver decisão abaixo); expiração do prazo converte em cashback via `EscolhasExpiradasScheduler`
  (cron a cada hora).

## Extensão do agregado `Sorteio` (módulo `sorteios`)

O módulo `sorteios` só tinha a entidade `Cota`. Cancelamento e dashboard precisavam de um agregado
`Sorteio` de verdade, então foi adicionado: entidade `Sorteio`, `SorteioRepository`, e os métodos
`listarPorSorteio`/`buscarPorId`/`contarPagasPorSorteio` em `CotaRepository`. **`cadastro-de-sorteio.feature`
continua fora de escopo** — não há endpoint para criar sorteios; os testes de integração/E2E deste
módulo precisam inserir sorteios diretamente no banco.

## Decisões de schema

- `Sorteio.valorCota`: o preço da cota não existia em nenhum lugar do schema original, mas é citado
  explicitamente no Contexto do `pagamento-de-cota.feature` ("o valor da cota é R$ 50,00"). Adicionado
  como campo obrigatório do sorteio (preço uniforme por cota).
- `Pagamento.compradorId` e `Pagamento.valorCashbackAplicado`: necessários para (a) o webhook saber
  a quem notificar/estornar sem depender do estado atual da cota, que pode já ter mudado de dono, e
  (b) rastrear pagamentos híbridos cashback+Pix/cartão em uma única linha (`Pagamento.cotaId` é
  `@unique`, então um mesmo pagamento é atualizado incrementalmente, nunca duplicado).
- `CreditoPendente` e `EscolhaPosCancelamento`: modelos novos, sem equivalente anterior no schema.

## Simplificações conscientes (documentadas para não serem confundidas com bugs)

- **Gateway de pagamento**: `SandboxPaymentGateway` é uma implementação fake (aprova cartões que não
  terminam em "0000", gera QR codes fictícios). Trocar por um adapter real do Mercado Pago é só
  reimplementar a porta `PaymentGateway` — nenhum caso de uso muda.
- **Webhook**: o corpo bruto (`payloadBruto`) e a assinatura chegam como campos explícitos do DTO, e
  não via captura do raw body HTTP (que exigiria configurar `rawBody` no NestFactory e é específico
  do formato de cada gateway). Isso é suficiente para validar a assinatura HMAC corretamente, mas um
  gateway real normalmente assina o corpo *tal como enviado na requisição* — ajustar a extração do
  raw body ao integrar com o Mercado Pago de verdade.
- **Revenda de uma cota estornada**: no cenário de webhook tardio, a cota pode voltar a ficar
  `DISPONIVEL` e ser vendida a outra pessoa depois. Como `Pagamento.cotaId` é único, um novo
  pagamento para essa mesma cota exigiria uma segunda linha — o schema atual não suporta histórico de
  múltiplas tentativas de pagamento por cota além do padrão "recusou → tentou de novo" (que reaproveita
  a mesma linha via `Pagamento.atualizarCobranca`). Resolver isso exigiria remover o `@unique` de
  `cotaId` e ajustar `buscarPorCotaId` para "o pagamento mais recente" — não implementado aqui.
