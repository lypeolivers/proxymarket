# ProxyMarket Backend – Orientação para o agente

## Propósito

API REST do **ProxyMarket** em Node.js, TypeScript (ESM), **Fastify 5**, **Prisma 6** e **Zod 4**. Autenticação JWT (cookies httpOnly) + proteção CSRF double-submit. Single-admin (sem perfis nem sistema de permissões). Use como base para adicionar os módulos de domínio do produto (proxys, vendas, clientes, etc.).

## Onde olhar

- **Bootstrap:** [src/server.ts](src/server.ts) — instancia o Fastify, registra plugins e error handler, escuta a porta configurada.
- **Plugins do Fastify:** [src/common/fastify/](src/common/fastify/) — `cookie`, `cors`, `helmet`, `rate-limit`, `csrf`, `swagger`, `zod`, `autoload`. Registrados em `src/common/fastify/index.ts`.
- **Módulos:** [src/modules/](src/modules/) — cada domínio (`auth`, `user`, `health`) com `controllers/`, `services/`, `routes/`, `schemas/`, `entities/` (e `types/` opcional).
- **Compartilhado:** [src/common/](src/common/) — erros (`ApiError`, `error-handler`, `zod-error`), helpers (`prisma`, `jwt`, `auth-cookies`, `csrf`, `jwt-expires-to-cookie-max-age`), middleware (`verifyAccessToken`) e schemas Zod compartilhados (`ListParams`, `Pagination`, `Status`, `ErrorResponse`).
- **Banco:** [src/infra/database/prisma.ts](src/infra/database/prisma.ts) — cliente Prisma e `runInTransaction()` com contexto opcional de usuário (`app.current_user_id`).
- **Env vars:** [src/env/index.ts](src/env/index.ts) — schema Zod com valores default seguros e validação extra em PROD/HMG.

## Como adicionar novas funcionalidades

### 1. Módulo novo ou estendido

Criar (ou estender) um módulo em `src/modules/<recurso>/` com as subpastas:

```
src/modules/<recurso>/
├── controllers/        # <ação>.controller.ts
├── services/           # <ação>.service.ts
├── routes/routes.ts    # plugin Fastify do módulo
├── schemas/            # <ação>.schema.ts (Zod)
├── entities/           # <recurso>.entity.ts (Zod)
└── types/              # opcional — tipos não derivados de schemas
```

- **Controller** recebe `request`/`reply` tipados, delega para o `service` e envia a resposta.
- **Service** contém a regra de negócio (Prisma, validações, transações).
- **Schema** define `Body`/`Params`/`Query`/`Response` em Zod e exporta um objeto `<Acao>Schema` com `body`, `params`, `query`, `response`, `description` e `tags` para o Fastify + Swagger.
- **Entity** representa o objeto canônico do domínio (geralmente parseado a partir do Prisma).

### 2. Registro de rotas

Registre as rotas em `routes/routes.ts` do módulo. Elas serão carregadas automaticamente — **não** importe o módulo em `server.ts`.

```ts
// src/modules/<recurso>/routes/routes.ts
import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleList from '../controllers/list.controller';
import { ListSchema } from '../schemas/list.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/<recurso>`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}`, { schema: ListSchema, onRequest }, handleList);
}
```

### 3. Novos modelos no banco

1. Adicione o `model` em `prisma/schema.prisma`.
2. Rode `npx prisma migrate dev --name <nome>` para gerar a migração.
3. Crie/atualize entities e services para refletir o novo modelo.

## Nomenclatura de pastas e arquivos

- **Pastas de módulo:** `kebab-case`, geralmente no singular (ex.: `user`, `auth`, `health`; no futuro `proxy-card`, `sale-order`).
- **Subpastas do módulo:** sempre minúsculas, no plural: `controllers/`, `services/`, `routes/`, `schemas/`, `entities/`, `types/`.
- **Arquivos:**
  - Controllers: `<ação>.controller.ts` (ex.: `signin.controller.ts`, `get-me.controller.ts`).
  - Services: `<ação>.service.ts` (ex.: `signin.service.ts`, `update-me.service.ts`).
  - Schemas: `<ação ou contexto>.schema.ts` (ex.: `signin.schema.ts`, `list.schema.ts`).
  - Entities: `<recurso>.entity.ts` (ex.: `user.entity.ts`).
  - Types: `<nome>.type.ts`.
  - Rotas: sempre `routes/routes.ts` no módulo.
- **Regra geral:** nomes de arquivos em **kebab-case**; sufixo indica o tipo (`.controller`, `.service`, `.schema`, `.entity`, `.type`).

## Autenticação, CSRF e permissões

- `verifyAccessToken` lê o JWT do cookie `access_token` (ou `Authorization: Bearer …`), valida assinatura/expiração e popula `request.userId`.
- Rotas mutativas (POST/PUT/PATCH/DELETE) passam pelo hook **CSRF** registrado em [src/common/fastify/csrf.ts](src/common/fastify/csrf.ts). Para isentar uma rota (ex.: primeiro login), use `config: { csrfExempt: true }`.
- **Não existe** `verifyApiPermission` — o app é single-admin. Se no futuro for necessário introduzir múltiplos usuários/papéis, replicar o padrão do teski (`resolve-api-permission.ts` + middleware + tabela `Profile`/`UserProfile`).

## Convenções e regras

- **Validar tudo com Zod** — schemas no `routes/routes.ts` rejeitam payloads inválidos antes de chegar no controller. Não acessar `request.body` sem schema.
- **Tipos derivados:** use `type T<Nome> = z.infer<typeof <Nome>>` para tipos de body/params/response.
- **Erros de domínio:** lance `ApiError(code, message, errors?, status?)` — o error handler global formata a resposta. Status default 400.
- **Transações:** use `runInTransaction(callback, request.userId)` para operações de escrita compostas. Reutiliza `app.current_user_id` no Postgres (auditoria futura).
- **Senhas:** sempre hash com `bcryptjs` usando `env.PASSWORD_HASH_SALT_ROUNDS`.
- **Idioma:** mensagens de erro voltadas ao usuário em **português**; nomes de variáveis/funções/classes em **inglês**.
- **Imports relativos** (sem alias). Mantenha a profundidade consistente com os módulos existentes.

## Testes (Vitest)

- Coloque arquivos `*.test.ts` ao lado do código que está testando (ex.: `src/modules/user/routes/user.routes.test.ts`).
- Use `buildTestApp()` de `src/test/build-app.ts` para instanciar um Fastify sem rotas e registrar manualmente apenas as do teste.
- Para autenticar via `app.inject`, importe `authorizationHeader(userId)` de `src/test/auth-headers.ts`.
- `src/test/setup-env.ts` define um conjunto de env vars fixas para os testes.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `yarn dev` | Dev server com `tsx watch` |
| `yarn build` | `prisma generate` + `tsc` |
| `yarn lint` | ESLint |
| `yarn lint:fix` | ESLint com `--fix` |
| `yarn test` | Vitest (single run) |
| `yarn test:watch` | Vitest em modo watch |
| `yarn db:seed` | Roda `prisma/seed.ts` (cria admin) |
