# Especificação técnica — Site de sorteios por cotas

**Versão:** 0.3
**Autor:** Elias
**Escopo:** Site público de sorteios por cotas numeradas, com dois perfis de usuário (administrador e comprador), acesso privado via convite de grupo do WhatsApp, e pagamento via Pix/cartão de crédito.

---

## 1. Visão geral

O site permite que **administradores** cadastrem prêmios e sorteios, vendam cotas numeradas para seus próprios grupos de compradores (organizados via WhatsApp), e controlem toda a operação — do cadastro do prêmio até o registro do vencedor. O sistema **não realiza o sorteio em si** (a aleatoriedade); ele vende as cotas e, ao final, fornece os dados para que o sorteio seja feito externamente (ex: ao vivo, Loteria Federal).

Cada administrador opera de forma isolada: seus sorteios só são visíveis para os compradores vinculados a ele.

---

## 2. Personas

| Persona | O que faz |
|---|---|
| **Administrador** | Cria e gerencia sorteios, cadastra prêmios, gera links de convite, acompanha vendas, registra o resultado do sorteio |
| **Comprador (cliente)** | Acessa via link de convite recebido no grupo do WhatsApp do administrador, se cadastra, escolhe e paga por cotas |

---

## 3. Acesso e multi-tenant

- O site é público (qualquer um pode ver que ele existe), mas o **acesso a um sorteio específico é privado**.
- Um administrador pode ter **vários grupos** (menu "Meus grupos" no painel), cada um correspondendo a um grupo real do WhatsApp.
- Cada grupo tem seu próprio **link/código de convite**, seu próprio conjunto de compradores e seus próprios sorteios.
- Cada grupo pode ter um **agente chatbot** ativado, que envia mensagens automáticas nesse grupo do WhatsApp (lembrete de cotas restantes, aviso de novo sorteio, resultado do sorteio).
- Quem se cadastra usando o link de um grupo vira comprador **vinculado a esse grupo** e só enxerga os sorteios realizados nele — mesmo que o mesmo administrador tenha outros grupos.
- O administrador se cadastra separadamente, sem precisar de convite (ele é quem cria seus próprios grupos).

---

## 4. Arquitetura

| Camada | Escolha | Observação |
|---|---|---|
| Backend | Node.js ou Python (FastAPI) | Framework de preferência da equipe |
| Frontend | React (site + painéis) | Duas áreas: painel do administrador e área do comprador |
| Banco de dados | PostgreSQL | Suporta bem transações, importante para cotas e pagamento |
| Autenticação | E-mail/senha + login social (Google, Apple, Facebook) | Fluxo de recuperação de senha por e-mail |
| Pagamento | **Mercado Pago** (Pix + cartão de crédito) | Ver seção 7 |
| Geração de xlsx | Biblioteca de planilha no backend (ex: openpyxl, exceljs) | Disparada automaticamente ao esgotar as cotas |
| Integração com WhatsApp | Provedor de WhatsApp Business API (ex: Meta Cloud API, Twilio, Z-API) | Usado pelo agente chatbot de cada grupo — a definir na fase de implementação |
| Tarefas agendadas (jobs) | Scheduler no backend (ex: cron job, BullMQ) | Necessário para: expirar reservas de cota após 2 min, abrir/encerrar vendas nas datas programadas |

---

## 5. Modelo de dados

Entidades principais (ver diagrama entregue na conversa):

- **Administrador** — id, nome, e-mail
- **Grupo** — id, administrador_id, nome, identificador do grupo do WhatsApp
- **AgenteChatbot** — id, grupo_id, ativo (sim/não), tipos de mensagem habilitados
- **LinkConvite** — id, grupo_id, código, status (ativo/revogado)
- **Comprador** — id, grupo_id (grupo ao qual pertence), nome, apelido, data de nascimento, telefone, CPF, endereço
- **Prêmio** — id, administrador_id, nome, descrição, foto, valor, valor_opcao_dinheiro (opcional — troca do prêmio por Pix)
- **Sorteio** — id, grupo_id, prêmio_id, data de abertura de vendas, data de encerramento de vendas, data de realização, quantidade de cotas
- **Cota** — id, sorteio_id, comprador_id, número, status (disponível/reservada/paga)
- **Pagamento** — id, cota_id, valor, status, método (Pix/cartão), id da transação no gateway

Regra-chave: uma cota é única por comprador dentro de um mesmo sorteio, mas um comprador pode ter várias cotas.

---

## 6. Regras de negócio centrais

- **Idade mínima:** 18 anos, validada no cadastro do comprador.
- **Escolha da cota:** o comprador escolhe manualmente o número da cota (não é atribuição automática).
- **Reserva:** ao escolher uma cota, ela fica reservada por **no máximo 2 minutos**; um alerta visual (estilo alerta de carrinho) avisa o tempo restante.
- **Concorrência:** o sistema impede que duas pessoas reservem a mesma cota ao mesmo tempo.
- **Expiração:** se o pagamento não é confirmado a tempo, a cota volta a ficar disponível.
- **Webhook tardio:** se a confirmação de pagamento chegar depois da reserva já ter expirado, o valor é **estornado automaticamente**.
- **Fim das vendas:** quando a última cota é vendida, o sistema gera automaticamente um arquivo xlsx com número da cota, telefone do comprador e endereço.
- **Resultado do sorteio:** feito externamente; o administrador registra o vencedor de volta na plataforma, alimentando um ranking de vencedores.
- **Opção de dinheiro no prêmio:** se o administrador cadastrar um valor de troca, o vencedor pode optar por receber esse valor via Pix em vez do prêmio físico; isso fica registrado junto ao vencedor.
- **Cancelamento de sorteio:** o comprador escolhe entre reembolso do valor investido ou manter a mesma quantidade de cotas para o próximo sorteio; se não se manifestar, o valor vira **cashback** para usar em um sorteio futuro de sua escolha.
- **LGPD:** o cadastro do comprador exige aceite explícito (caixa de marcação obrigatória, não pré-marcada) de um termo de consentimento sobre a retenção dos seus dados, registrado com data e hora do aceite.
- **Grupos:** cada sorteio pertence a um grupo específico do administrador; um comprador só enxerga sorteios do(s) grupo(s) ao qual pertence.
- **Dinheiro:** todo o valor das vendas entra em uma única conta central da plataforma; o repasse aos administradores é manual (sem split automático, por enquanto).

---

## 7. Pagamento

- **Moeda:** sempre real (BRL), operação só no Brasil.
- **Métodos:** Pix e cartão de crédito.
- **Gateway recomendado:** **Mercado Pago** — maior reconhecimento pelo comprador final (ajuda na conversão), taxa de Pix competitiva (~0,99%), boa documentação de Checkout Transparente/Pro e webhooks.
- Alternativas avaliadas: Pagar.me (exige CNPJ ativo e análise de risco) e Asaas (split nativo, mas desnecessário agora que o modelo é conta central).
- Toda notificação de pagamento (webhook) deve ter **assinatura validada** antes de alterar o status de qualquer cota.

---

## 8. Fluxos já especificados em BDD (Gherkin)

| Arquivo | Cobre |
|---|---|
| `cadastro-de-premio.feature` | Cadastro e edição de prêmios |
| `cadastro-de-sorteio.feature` | Cadastro de sorteio, datas, abertura/encerramento automáticos |
| `cadastro-de-comprador.feature` | Cadastro do comprador, validações, idade mínima |
| `reserva-de-cota.feature` | Escolha e reserva de cota, concorrência, expiração |
| `pagamento-de-cota.feature` | Pagamento via Pix/cartão, webhook, estorno tardio |
| `acesso-via-convite.feature` | Geração e uso do link de convite, isolamento entre administradores |
| `login-cliente.feature` | Login, cadastro, login social, recuperação de senha do comprador |
| `login-administrador.feature` | Login e cadastro do administrador, confirmação de e-mail, isolamento de papéis |
| `painel-administrador.feature` | Gestão de sorteios, cotas, compradores, xlsx, resultado, ranking, links, escolha prêmio/dinheiro do vencedor |
| `dashboard-visao-geral.feature` | Tela inicial do painel: KPIs, atalhos |
| `conta-administrador.feature` | Perfil, troca de senha e e-mail do administrador |
| `meus-grupos.feature` | Cadastro de grupos do WhatsApp, agente chatbot, usuários e sorteios por grupo |
| `cancelamento-de-sorteio.feature` | Cancelamento de sorteio, reembolso, cotas para o próximo, cashback |

---

## 9. Itens ainda em aberto

Todos os pontos levantados durante a especificação foram cobertos. Pontos que ficam para a fase de implementação, sem impacto no comportamento funcional:
- Detalhes técnicos exatos da integração de login social (Google, Apple, Facebook)
- Escolha final entre Mercado Pago e alternativas, a confirmar taxas atualizadas no momento da integração
- Escolha do provedor de WhatsApp Business API para o agente chatbot (Meta Cloud API, Twilio, Z-API, etc.)
