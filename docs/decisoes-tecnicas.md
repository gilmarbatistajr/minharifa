# Decisões técnicas — Site de sorteios

**Objetivo:** fechar as decisões de implementação necessárias para gerar código com padrões de projeto aplicados, testes automatizados (unitário + e2e) e análise estática.

---

## 1. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | **TypeScript** (backend e frontend) | Tipagem estática ajuda a manter os padrões e pega erros antes de rodar |
| Backend framework | **NestJS** | Já vem estruturado em módulos, com injeção de dependência nativa — facilita aplicar Clean Architecture sem reinventar a roda |
| ORM | **Prisma** | Migrations versionadas, tipagem automática do schema, boa integração com Postgres e testes |
| Banco de dados | **PostgreSQL** | Já definido antes |
| Frontend framework | **Next.js (React)** | Site público se beneficia de SSR (SEO, carregamento rápido); área logada roda como app client-side normalmente |
| Gerenciador de pacotes | **pnpm** | Mais rápido e eficiente em monorepo |
| Estrutura de repositório | **Monorepo** (`apps/api`, `apps/web`, pacotes compartilhados em `packages/`) | Um único lugar para tipos compartilhados (ex: DTOs) entre back e front |

---

## 2. Arquitetura de código (backend)

Dentro do NestJS, vamos seguir uma variação de **Clean Architecture em camadas**:

```
apps/api/src/
  modules/
    sorteios/
      domain/          → entidades e regras de negócio puras (sem dependência de framework)
      application/      → casos de uso (ex: ReservarCotaUseCase, CancelarSorteioUseCase)
      infrastructure/    → implementação do Prisma (repositories concretos)
      presentation/    → controllers, DTOs de entrada/saída
    compradores/
    administradores/
    grupos/
    premios/
    pagamentos/
    ...
  shared/            → utilitários, exceptions, decorators comuns
```

- **Repository pattern**: cada módulo define uma interface de repositório na camada `domain`, implementada na `infrastructure` com Prisma. Isso permite trocar o Prisma por outra coisa no futuro sem tocar nas regras de negócio, e facilita mockar em testes unitários.
- **Casos de uso explícitos** (`application`): cada ação relevante do BDD (ex: "reservar cota", "cancelar sorteio", "registrar vencedor") vira uma classe de caso de uso testável isoladamente — mapeamento direto dos `.feature` que já escrevemos.
- **Injeção de dependência**: nativa do NestJS (decorators `@Injectable()`, `@Inject()`), sem necessidade de container extra.

---

## 3. Testes

| Tipo | Ferramenta | Observação |
|---|---|---|
| Unitário | **Jest** | Cobertura mínima de 80%, configurada em `jest.config.ts` com `coverageThreshold` — o build falha se cair abaixo disso |
| E2E | **Cucumber + Cypress** (`@badeball/cypress-cucumber-preprocessor`) | Os `.feature` que já escrevemos viram os arquivos-fonte; eu escrevo os step definitions em Cypress apontando pra eles |
| Análise estática | **ESLint + Prettier** (regras strict do TypeScript) | Bloqueia código com problemas antes mesmo de rodar teste |
| Qualidade contínua | **SonarCloud** (gratuito para projetos pequenos) | Métricas de cobertura, duplicação e complexidade, integrado ao CI |

---

## 4. CI/CD

**GitHub Actions**, com um pipeline que roda a cada push/PR:
1. Instala dependências
2. Lint (ESLint)
3. Testes unitários com cobertura (falha se < 80%)
4. Testes e2e (Cucumber + Cypress)
5. Análise SonarCloud
6. Build

---

## 5. Autenticação

- **JWT** para sessão da aplicação, usando Passport.js (integrado ao NestJS via `@nestjs/passport`)
- Login social via `passport-google-oauth20`, `passport-facebook` e Sign in with Apple (`passport-apple`)
- Senhas com hash **bcrypt**

---

## 6. Integrações externas — o que eu ainda preciso de você

Essas eu não consigo decidir sozinho, pois dependem de contas/credenciais suas:

| Integração | O que falta |
|---|---|
| **Mercado Pago** | Credenciais de sandbox (Access Token de teste) para eu implementar e testar o fluxo de pagamento de verdade |
| **WhatsApp Business API** | Escolha do provedor — vou sugerir **Meta Cloud API** por padrão (oficial, tem camada gratuita), mas isso exige verificação de número comercial, o que leva alguns dias — quer que eu já parta desse padrão? |
| **Hospedagem** | Vou sugerir **Railway** por padrão para MVP (deploy simples de Postgres + Node + Next.js), mas se você já tiver preferência (AWS, Render, VPS própria), me avisa |
| **E-mail transacional** | Preciso de um provedor para os e-mails (confirmação de cadastro, recuperação de senha, notificações) — vou sugerir **Resend** por padrão, simples de integrar |

---

## 7. O que acontece a seguir

Com essas decisões fechadas, o próximo passo é eu:
1. Estruturar o monorepo (schema Prisma completo a partir do modelo de dados já validado)
2. Implementar módulo por módulo, seguindo a ordem: Administrador/Auth → Grupos → Prêmios → Sorteios → Compradores/Auth → Cotas/Reserva → Pagamento → Cancelamento/Cashback → Painel
3. Cada módulo sai com: casos de uso, testes unitários (≥80%), e os step definitions do Cucumber implementando os `.feature` já existentes
