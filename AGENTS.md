# ProxyMarket – Orientação para o agente

## Propósito

**ProxyMarket** é uma plataforma web em português para **organizar a venda de proxys (cartas personalizadas)**. Substitui o controle atual feito em planilhas e prepara o terreno para features futuras (catálogo, pedidos, clientes, métricas). Monorepo com dois projetos independentes (`backend/` e `frontend/`) sem workspace compartilhado.

> A arquitetura espelha o template do projeto Teski (mesmas convenções de módulos, validação, autenticação e UI), porém com **escopo reduzido**: admin único, sem upload S3, WebSocket, LiveKit, Web Push, e-mail ou OpenAI.

## Documentos vivos (leia antes de começar)

Além deste arquivo (que cobre arquitetura e convenções **técnicas**), o projeto mantém uma pasta `docs/` com guias auxiliares:

- [`docs/agent-context.md`](docs/agent-context.md) — visão do produto, domínio, decisões tomadas, roadmap, perguntas em aberto e aprendizados acumulados pelos agentes.
- [`docs/setup-guide.md`](docs/setup-guide.md) — passo a passo para rodar o projeto pela primeira vez (pré-requisitos, banco, backend, frontend, troubleshooting) e comandos do dia a dia.

Consulte `agent-context.md` no início de qualquer conversa nova e **atualize-o ao final** quando tomar decisões, descobrir algo não-trivial ou concluir uma feature (ver seção [Regras para o agente](#regras-para-o-agente)).

## Arquitetura geral

| Camada | Tecnologia principal |
|--------|---------------------|
| API | Node.js, TypeScript (ESM), **Fastify 5**, Prisma 6, Zod 4, JWT |
| Web | **React 19**, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Banco | PostgreSQL (via Prisma ORM) |
| Auth | JWT (access + refresh) em cookies httpOnly + CSRF double-submit |

## Estrutura do repositório

```
proxymarket/
├── AGENTS.md                       # este arquivo
├── README.md
├── docs/
│   ├── agent-context.md            # contexto vivo: domínio, decisões, roadmap, aprendizados
│   └── setup-guide.md              # guia de inicialização e comandos do dia a dia
├── backend/                        # API REST (Fastify)
│   ├── AGENTS.md                   # guia específico do backend (como criar módulos)
│   ├── prisma/
│   │   ├── schema.prisma           # User mínimo (admin)
│   │   └── seed.ts                 # cria o admin inicial
│   └── src/
│       ├── server.ts               # bootstrap do Fastify
│       ├── env/                    # validação de env vars (Zod)
│       ├── common/                 # errors, fastify plugins, helpers, middlewares, schemas
│       ├── infra/database/         # cliente Prisma + runInTransaction
│       ├── modules/                # auth, user, health (cada módulo segue o mesmo padrão)
│       └── test/                   # helpers de teste (build-app, auth-headers)
└── frontend/                       # SPA React
    └── src/
        ├── main.tsx                # entry do Vite
        ├── App.tsx                 # rotas + providers
        ├── context/                # AuthContext (sessão)
        ├── pages/                  # AuthPage, DashboardPage, LogoutPage
        ├── components/             # RequireAuth, ProxyMarketLogo, ui/* (shadcn)
        ├── layouts/                # AppShell (sidebar simplificada)
        ├── modules/                # auth, user (espelham backend)
        ├── lib/                    # api.ts (Axios), api-error.ts, utils.ts
        └── models/                 # tipos Zod compartilhados pelo app
```

## Backend

> Detalhes completos em [`backend/AGENTS.md`](backend/AGENTS.md).

### Módulos iniciais (`backend/src/modules/`)

Cada módulo segue a estrutura: `controllers/`, `services/`, `routes/`, `schemas/`, `entities/` (e `types/` se necessário).

| Módulo | Descrição |
|--------|-----------|
| `auth` | Sign in, refresh token, sign out (JWT + cookies httpOnly + CSRF) |
| `user` | `GET /user/me` e `PUT /user/me` (perfil do admin autenticado) |
| `health` | Health check (`/actuator/health`) |

### Autenticação

- **JWT:** access token + refresh token em **cookies httpOnly**.
- **CSRF:** cookie `csrf_token` (não-httpOnly) reenviado pelo frontend via header `X-CSRF-Token` (double-submit). O `/auth/signin`, `/auth/refresh` e `/auth/signout` são isentos via `config.csrfExempt = true`.
- **Middleware:** `verifyAccessToken` (não há `verifyApiPermission` porque o app é single-admin).

### Rotas

- Auto-carregadas a partir de `src/modules/*/routes/routes.ts` via `@fastify/autoload`.
- Não é necessário registrar módulos manualmente em `server.ts`.
- URL base configurável via `BASE_URL` (padrão `/api`).

### Banco de dados

- Schema em `backend/prisma/schema.prisma` (apenas `enum Status` + `model User`).
- Migrações: `npx prisma migrate dev` (desenvolvimento) ou `npx prisma migrate deploy` (produção).
- Helper `runInTransaction()` em `src/infra/database/prisma.ts` para escritas atômicas.
- Seed: `yarn db:seed` cria o admin com base nas vars `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Frontend

### Roteamento

- React Router v7 com rotas aninhadas em `App.tsx`.
- Rotas protegidas por `<RequireAuth />`.
- **Não há `PermissionGate`** — não existe sistema de permissões.
- Base path configurável via `VITE_BASE_PATH`.

### Principais rotas

| Rota | Página | Auth |
|------|--------|------|
| `/entrar` | Login | pública |
| `/sair` | Logout | pública |
| `/` | Dashboard | autenticada |

> Próximas rotas (a adicionar conforme o planejamento avançar): `/proxys`, `/vendas`, `/clientes`.

### Estado e cliente HTTP

- **React Context:** `AuthContext` expõe `auth`, `signIn`, `signOut`, `loadSessionFromStorage`.
- Sessão persistida em `sessionStorage` (sobrevive ao refresh; nunca guarda tokens).
- **Axios** em `src/lib/api.ts` com interceptors:
  - `withCredentials: true` (envia cookies automaticamente).
  - Auto-refresh em respostas `401` (chama `auth/refresh` e repete a requisição).
  - Reenvio do cookie `csrf_token` como header `X-CSRF-Token`.
  - Conversão de erros para `ApiError`.

### Componentes UI

- **Radix UI + shadcn** (estilo `radix-nova`) como base.
- **Tailwind CSS v4** + `tw-animate-css`.
- **Lucide React** para ícones.
- Adicione componentes shadcn conforme a necessidade — não pré-instale tudo.

### Módulos de feature (`frontend/src/modules/`)

Espelham os módulos do backend. Cada um tem `services/` com chamadas Axios à API e, opcionalmente, `components/`, `hooks/`, `schemas/`, `types/`.

## Convenções de código

### Nomenclatura

- **Pastas:** `kebab-case` (ex.: `auth`, `user`, no futuro `proxy-card`, `sale-order`).
- **Arquivos backend:** `<ação>.controller.ts`, `<ação>.service.ts`, `<contexto>.schema.ts`, `<recurso>.entity.ts`, `<nome>.type.ts`, `routes/routes.ts`.
- **Arquivos frontend:** Componentes em `PascalCase.tsx`, services em `kebab-case.service.ts`.
- **Funções:** `camelCase`.

### Imports

- **Backend:** ES modules (`import`/`export`). Caminhos relativos.
- **Frontend:** Alias `@/*` para `src/` configurado no `tsconfig.json` e `vite.config.ts`.

### Validação (Zod)

- Backend: schemas definem request/response e geram tipos via `z.infer`. Fastify valida automaticamente via `fastify-type-provider-zod`.
- Frontend: Zod usado para validar respostas críticas da API e payloads de formulário.

### Tratamento de erros

- Backend: factory `ApiError(code, message, errors?, status?)`. Error handler global converte erros Zod automaticamente e responde JSON com `{ message, code }`.
- Frontend: interceptor Axios converte erros para `ApiError` (`src/lib/api-error.ts`). Status 401 dispara auto-refresh; após falhar, redireciona para `/sair?expired=1`.

## Testes

- **Framework:** Vitest (backend).
- **Arquivos:** `*.test.ts` co-localizados com o código-fonte.
- **Helpers:** `src/test/build-app.ts` (factory de app sem rotas), `auth-headers.ts` (Bearer para `app.inject`).
- **Comandos:** `yarn test` (single run), `yarn test:watch` (modo watch).

## Scripts principais

| Onde | Comando | Descrição |
|------|---------|-----------|
| `backend/` | `yarn dev` | Dev server com hot reload (`tsx watch`) |
| `backend/` | `yarn build` | `prisma generate` + `tsc` |
| `backend/` | `yarn test` | Vitest (single run) |
| `backend/` | `yarn lint` / `yarn lint:fix` | ESLint |
| `backend/` | `yarn db:seed` | Cria o admin inicial a partir do `.env` |
| `frontend/` | `yarn dev` | Vite dev server com HMR (proxy `/api` → `http://127.0.0.1:3333`) |
| `frontend/` | `yarn build` | `tsc -b` + `vite build` |
| `frontend/` | `yarn preview` | Servir build local |
| `frontend/` | `yarn lint` | ESLint |

## Variáveis de ambiente

- **Backend** (`backend/.env`): `APP_NAME`, `MODE`, `PORT`, `BASE_URL`, `DATABASE_URL`, `AUTH_JWT_*`, `PASSWORD_HASH_SALT_ROUNDS`, `CORS_ALLOWED_ORIGINS`, `APP_WEB_URL`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- **Frontend** (`frontend/.env`): `VITE_BASE_PATH` (opcional), `VITE_APP_API_BASE_URL` (opcional — só para API em outro domínio).

## Regras para o agente

- Antes de começar uma tarefa nova, **leia [`docs/agent-context.md`](docs/agent-context.md)** — ele contém o estado atual do projeto, decisões já tomadas e perguntas em aberto que podem afetar a tarefa.
- Ao **tomar uma decisão arquitetural ou de domínio** durante a conversa, registre uma entrada na seção *Decisões* de `docs/agent-context.md` antes de encerrar o turno.
- Ao **descobrir algo não-trivial** (peculiaridade da API, lib testada e descartada, padrão que custou tempo entender), registre na seção *Aprendizados dos agentes* do mesmo arquivo.
- Ao **concluir uma feature**, atualize a seção *Estado atual* do roadmap em `docs/agent-context.md`.
- Ao criar **módulos novos** no backend, seguir o guia em [`backend/AGENTS.md`](backend/AGENTS.md) e a anatomia dos módulos existentes (`auth`, `user`).
- **Sempre** validar request/response com Zod schemas.
- **Nunca** registrar módulos manualmente no `server.ts` — o autoload de `src/modules/*/routes/routes.ts` cuida disso.
- Proteger rotas autenticadas com `verifyAccessToken` (não há sistema de permissões; basta o token válido). Endpoints públicos: `/auth/*` e `/actuator/health`.
- Rotas mutativas (POST/PUT/PATCH/DELETE) são protegidas por CSRF — só exemplificar `csrfExempt: true` quando o cliente realmente não puder ter o cookie (ex.: primeiro login).
- No frontend, novos serviços ficam em `src/modules/<recurso>/services/` e seguem o padrão Axios + Zod-parse dos serviços existentes.
- Respeitar a separação: backend e frontend são projetos independentes, sem código compartilhado.
- Usar **português** para textos visíveis ao usuário e nomes de rotas (URL e React Router); manter **código** (funções, variáveis, classes, schemas) **em inglês**.

## Regras gerais

- Sempre use **yarn** como package manager.
- Sempre rode `yarn lint` e `yarn build` (em ambos os projetos) e verifique os erros antes de dar a tarefa como concluída.
- Não adicione features de infraestrutura (S3, WebSocket, LiveKit, Push, e-mail, Cron) sem solicitação explícita — o escopo inicial foi propositalmente enxuto.
