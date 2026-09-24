# Módulo: administradores

Implementado seguindo o padrão do módulo `sorteios` (domain/application/infrastructure/presentation).

## Cobertura por feature

- `login-administrador.feature`: cadastro, confirmação de e-mail, login, recuperação/redefinição
  de senha. Bloqueio de acesso cruzado (admin↔cliente) é feito pelos guards
  `AdministradorGuard`/`CompradorGuard` (`shared/auth`), não por casos de uso dedicados.
- `conta-administrador.feature`: visualizar conta, atualizar nome, alterar senha, solicitar/confirmar
  troca de e-mail. "Encerrar sessão" não tem caso de uso: a sessão é um JWT stateless, então logout é
  responsabilidade do cliente (descartar o token) — não há estado no servidor para invalidar.
- `dashboard-visao-geral.feature`: `ObterVisaoGeralDashboardUseCase` cobre os 4 cenários (onboarding,
  sorteios ativos, encerrando em 24h, aguardando resultado). Depende de `SORTEIO_REPOSITORY` e
  `COTA_REPOSITORY` do módulo `sorteios` (acoplamento cross-module deliberado, via import do
  `SorteiosModule`).

## Pré-requisito implementado junto: infraestrutura de auth

Não existia nenhuma auth antes deste trabalho. Foi criada em `shared/auth/`:
JWT strategy, `TokenService`, guards `AdministradorGuard`/`CompradorGuard`, decorator `@CurrentUser()`.
E em `shared/domain` + `shared/services`: portas `PasswordHasher` (bcrypt), `TokenGenerator` (crypto
randomBytes) e `NotificationSender` (implementação sandbox que só loga — trocar por adapter Resend/
WhatsApp em produção).
