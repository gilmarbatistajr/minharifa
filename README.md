# minharifa

Aplicação web para gestão de sorteios por cotas — venda de cotas numeradas, gestão multi-tenant por grupos de WhatsApp, pagamento via Pix/cartão, e painel administrativo completo.

## Stack

- **Backend:** NestJS + TypeScript, arquitetura em camadas (domain / application / infrastructure / presentation)
- **ORM:** Prisma + PostgreSQL
- **Frontend:** Next.js (React)
- **Testes:** Jest (unitário, cobertura mínima 80%) + Cucumber/Gherkin + Cypress (e2e)
- **Monorepo:** pnpm workspaces

## Estrutura

```
apps/
  api/     → backend NestJS
  web/     → frontend Next.js
e2e/       → testes e2e (Cucumber + Cypress), incluindo os arquivos .feature
```

## Rodando localmente

1. Instale Node.js 20+, pnpm (`corepack enable`) e Docker.
2. `docker compose up -d` — sobe o PostgreSQL local.
3. `cp .env.example .env` e preencha as variáveis (Mercado Pago, WhatsApp, etc.).
4. `pnpm install` — instala as dependências de todos os pacotes.
5. `pnpm prisma:migrate` — cria as tabelas no banco.
6. `pnpm dev:api` e, em outro terminal, `pnpm dev:web`.

## Testes

- `pnpm test` — testes unitários de todos os pacotes
- `pnpm test:cov` — com relatório de cobertura (o build falha abaixo de 80%)
- `pnpm test:e2e` — testes end-to-end (API e Web precisam estar rodando)

## Estado atual

O módulo `sorteios` (reserva de cota) está implementado como referência do padrão de arquitetura a seguir. Os módulos `administradores`, `grupos`, `compradores`, `premios` e `pagamentos` estão com a estrutura de pastas criada e um `NOTES.md` explicando o que implementar em cada um, mapeado para os arquivos `.feature` correspondentes em `e2e/cypress/e2e/features/`.
