# ProxyMarket

Plataforma web em português para organizar a **venda de proxys (cartas personalizadas)**. Substitui o controle manual em planilhas por uma base extensível com autenticação, painel administrativo e modelagem de domínio em PostgreSQL.

> **Status:** scaffold inicial — apenas autenticação (admin único), perfil do usuário e health check. Os módulos de domínio (proxys, vendas, clientes) serão adicionados conforme o planejamento avançar.

## Stack

- **Backend:** Node.js + TypeScript (ESM), Fastify 5, Prisma 6, Zod 4, JWT.
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/Radix, React Router 7.
- **Banco:** PostgreSQL.

## Estrutura

```
proxymarket/
├── AGENTS.md           # guia geral para agentes de IA
├── backend/            # API REST (Fastify)
│   ├── AGENTS.md       # guia específico do backend
│   ├── prisma/
│   └── src/
└── frontend/           # SPA React
    └── src/
```

> O guia [`AGENTS.md`](AGENTS.md) detalha convenções, regras e o porquê das escolhas arquiteturais. Leia-o antes de criar novos módulos.

## Pré-requisitos

- Node.js 20+ (recomendado 22).
- Yarn 1.x (`yarn --version`).
- PostgreSQL 14+ rodando localmente (ou Docker).

## Setup rápido

```bash
# 1) Backend
cd backend
cp .env.example .env          # ajuste DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD e os segredos JWT
yarn install
npx prisma migrate dev         # cria as tabelas no Postgres
yarn db:seed                   # cria o admin com base no .env
yarn dev                       # API em http://localhost:3333

# 2) Frontend (em outro terminal)
cd ../frontend
cp .env.example .env           # opcional — só para customizar VITE_BASE_PATH
yarn install
yarn dev                       # SPA em http://localhost:5173 (proxy /api → :3333)
```

A SPA chama `/api/*`, que o Vite redireciona para a API local automaticamente.

O `yarn dev` do frontend também expõe a SPA na rede local (linha **Network** no terminal). Outro dispositivo na mesma Wi-Fi/LAN pode abrir essa URL no navegador — sem instalar o ambiente de dev. Veja [§7.1 em `docs/setup-guide.md`](docs/setup-guide.md#71-acesso-de-outro-dispositivo-na-mesma-rede).

> **Primeira vez no projeto?** Veja o passo a passo detalhado (com pré-requisitos, criação do banco no Postgres/Docker, geração de segredos, verificação e troubleshooting) em [`docs/setup-guide.md`](docs/setup-guide.md).

## Variáveis essenciais

### `backend/.env`

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Postgres. |
| `AUTH_JWT_ACCESS_TOKEN_SECRET` / `_EXPIRES_IN` | Segredo e duração do access token. |
| `AUTH_JWT_REFRESH_TOKEN_SECRET` / `_EXPIRES_IN` | Segredo e duração do refresh token. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Usadas por `yarn db:seed`. |
| `CORS_ALLOWED_ORIGINS` | Obrigatório em PROD/HMG (lista separada por vírgula). |
| `BASE_URL` | Prefixo das rotas (`/api` por padrão). |

### `frontend/.env`

| Variável | Descrição |
|----------|-----------|
| `VITE_BASE_PATH` | Subcaminho da SPA (ex.: `/proxymarket/`). Default `/`. |
| `VITE_APP_API_BASE_URL` | Só defina se a API for em outro domínio (URL absoluta). Para acesso na rede local via `yarn dev`, deixe vazio — use o proxy `/api`. |

## Comandos úteis

### Backend (`cd backend`)

| Comando | Descrição |
|---------|-----------|
| `yarn dev` | Dev server com hot reload (`tsx watch`). |
| `yarn build` | `prisma generate` + `tsc`. |
| `yarn lint` / `yarn lint:fix` | ESLint. |
| `yarn test` / `yarn test:watch` | Vitest. |
| `yarn db:seed` | Cria/atualiza o admin a partir do `.env`. |
| `npx prisma migrate dev` | Aplica migrações em desenvolvimento. |
| `npx prisma studio` | UI para inspecionar o banco. |

### Frontend (`cd frontend`)

| Comando | Descrição |
|---------|-----------|
| `yarn dev` | Vite dev server com HMR. |
| `yarn build` | `tsc -b` + `vite build`. |
| `yarn preview` | Serve o build local. |
| `yarn lint` | ESLint. |

## Endpoints iniciais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/signin` | Login (corpo `{ username: email, password }`). |
| `POST` | `/api/auth/refresh` | Rotaciona access/refresh/CSRF a partir do cookie. |
| `POST` | `/api/auth/signout` | Logout resiliente (limpa cookies). |
| `GET` | `/api/user/me` | Dados do admin autenticado. |
| `PUT` | `/api/user/me` | Atualiza nome, e-mail e/ou senha do admin. |
| `GET` | `/api/actuator/health` | Health check (`"ok"`). |

Documentação Swagger interativa em `http://localhost:3333/documentation` enquanto o backend roda.

## Próximos passos sugeridos

1. Modelar as entidades do domínio (`Proxy`, `Sale`, `Customer`, etc.) no `prisma/schema.prisma`.
2. Criar os módulos correspondentes no backend seguindo o guia [`backend/AGENTS.md`](backend/AGENTS.md).
3. Adicionar páginas no frontend (`src/pages/`) e serviços (`src/modules/<recurso>/services/`).
4. Incrementar a sidebar do [`AppShell`](frontend/src/layouts/AppShell.tsx) com as novas seções.

## Outros projetos neste repositório

### [Pokemeta](pokemeta/README.md)

Ferramenta para **análise de winrate** de baralhos **Pokémon TCG** (upload CSV + gráfico no navegador). Stack semelhante, mas app separado: API na porta **3334**, SPA na **5174**, banco **`pokemeta`**. Ver [`pokemeta/docs/setup-guide.md`](pokemeta/docs/setup-guide.md).
