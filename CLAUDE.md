# minharifa — contexto para o Claude Code

Aplicação web de gestão de sorteios por cotas numeradas, multi-tenant por grupos de WhatsApp.
Veja `README.md` para setup local e `docs/especificacao-tecnica-sorteios.md` e `docs/decisoes-tecnicas.md`
para a especificação funcional completa e as decisões de arquitetura.

## Stack e versões fixas

- Node **22.22.2** (ver `.nvmrc`) — usar `nvm use`
- pnpm **9.12.0** (fixado em `packageManager` no `package.json` raiz — `corepack enable` ativa a versão certa automaticamente)
- NestJS + TypeScript (backend, `apps/api`)
- Next.js + React (frontend, `apps/web`)
- Prisma + PostgreSQL (`apps/api/prisma/schema.prisma`)
- Jest (unitário) + Cucumber/Gherkin + Cypress (e2e, pacote `e2e/`)

## Padrão de arquitetura — SEMPRE seguir isto ao implementar um módulo

Cada módulo em `apps/api/src/modules/<nome>/` segue 4 camadas:

```
domain/
  entities/          → classes com as regras de negócio, SEM import de NestJS/Prisma
  repositories/       → apenas interfaces (portas) + símbolo para DI
application/
  use-cases/           → um caso de uso por ação relevante do .feature correspondente,
                        SEMPRE com um .spec.ts ao lado cobrindo os cenários do Gherkin
infrastructure/
  prisma-*.repository.ts → implementação concreta da interface, usando PrismaService
presentation/
  *.controller.ts
  dto/                → validados com class-validator
<nome>.module.ts
```

Ver `apps/api/src/modules/sorteios/` como implementação de referência já pronta e testada.
Os demais módulos (`administradores`, `grupos`, `compradores`, `premios`, `pagamentos`) têm
um `NOTES.md` explicando o que falta e o mapeamento com os arquivos `.feature`.

## Regras de qualidade não-negociáveis

- Cobertura de testes unitários **mínimo 80%** nas camadas `domain/` e `application/`
  (é isso que o `jest.config.ts` mede — controllers e repositórios Prisma ficam de fora
  do gate porque são cobertos pelos testes e2e, não unitários).
- Todo caso de uso novo precisa nascer com teste unitário cobrindo, no mínimo, os cenários
  do `.feature` correspondente em `e2e/cypress/e2e/features/`.
- Rodar `pnpm lint` e `pnpm test:cov` antes de considerar qualquer módulo pronto.
- Nunca acessar o Prisma diretamente de dentro de um caso de uso — sempre através da
  interface de repositório da camada `domain`.

## Comandos úteis

```bash
pnpm install                    # instala tudo (usa o pnpm-lock.yaml já commitado)
docker compose up -d            # sobe o Postgres local
pnpm prisma:migrate             # roda as migrations
pnpm dev:api / pnpm dev:web     # sobe API e Web em desenvolvimento
pnpm test:cov                   # testes unitários + cobertura (gate de 80%)
pnpm test:e2e                   # Cucumber + Cypress (API e Web precisam estar rodando)
pnpm lint                       # ESLint em todos os pacotes
```

## Próximo passo sugerido

Implementar os módulos `administradores` e `grupos` primeiro (auth e multi-tenant são
pré-requisito dos demais), seguindo exatamente o padrão do módulo `sorteios`.
