# ProxyMarket — Guia de inicialização

> Guia passo a passo para rodar o projeto pela **primeira vez** em uma máquina nova. Para comandos do dia a dia (já configurado), pule direto para [§7](#7-comandos-do-dia-a-dia).

---

## 1. Pré-requisitos

Instale antes de começar:

| Ferramenta | Versão | Verificar com |
|-----------|--------|---------------|
| **Node.js** | 20.x ou superior (recomendado 22.x) | `node --version` |
| **Yarn** | 1.22.x (Classic) | `yarn --version` |
| **PostgreSQL** | 14 ou superior | `psql --version` |
| **Git** | qualquer versão recente | `git --version` |

> **Windows:** o projeto foi montado em paths Windows (`c:\PROJETOS\LYPE\proxymarket`). Rode os comandos em **PowerShell**, **Git Bash** ou no **terminal integrado do Cursor** — qualquer um funciona.
>
> **Yarn:** se ainda não tem, instale com `npm install -g yarn`.

---

## 2. Preparar o banco PostgreSQL

Você precisa de um banco vazio chamado `proxymarket` (ou outro nome — basta refletir em `DATABASE_URL` depois).

### Opção A — Postgres instalado nativamente

```bash
psql -U postgres -c "CREATE DATABASE proxymarket;"
```

### Opção B — Postgres via Docker (sem instalar local)

```bash
docker run --name proxymarket-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=proxymarket \
  -p 5432:5432 \
  -d postgres:16
```

Para parar/iniciar depois:

```bash
docker stop proxymarket-db
docker start proxymarket-db
```

> A `DATABASE_URL` no `.env` precisa bater com o usuário, senha, host, porta e nome do banco. O exemplo abaixo assume `postgres:postgres@127.0.0.1:5432/proxymarket`.

---

## 3. Backend — primeira inicialização

A partir da raiz do repositório:

```bash
cd proxymarket/backend
```

### 3.1 Criar e configurar o `.env`

```bash
cp .env.example .env
```

Abra `backend/.env` e ajuste **obrigatoriamente** os campos abaixo:

| Variável | O que colocar |
|----------|--------------|
| `DATABASE_URL` | Connection string do banco criado no passo §2 (ex.: `postgresql://postgres:postgres@127.0.0.1:5432/proxymarket`). |
| `AUTH_JWT_ACCESS_TOKEN_SECRET` | String aleatória de **pelo menos 32 caracteres**. Gere com `openssl rand -hex 32` ou no PowerShell: `[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")`. |
| `AUTH_JWT_REFRESH_TOKEN_SECRET` | Outra string aleatória de 32+ caracteres (diferente da de cima). |
| `ADMIN_EMAIL` | E-mail que você vai usar para logar (ex.: `seu@email.com`). |
| `ADMIN_PASSWORD` | Senha do admin (mínimo 8 caracteres). **Você vai usar essa senha no primeiro login.** |

> Os demais campos podem ficar com o valor default em desenvolvimento. Em produção, defina `MODE=PROD` e `CORS_ALLOWED_ORIGINS` (obrigatório).

### 3.2 Instalar dependências

```bash
yarn install
```

> O script `postinstall` roda `prisma generate` automaticamente — você verá o Prisma criando o client em `prisma/generated/prisma/`.

### 3.3 Criar as tabelas no banco (primeira migração)

```bash
npx prisma migrate dev --name init
```

O Prisma vai:
- Conectar no banco usando a `DATABASE_URL`.
- Criar a tabela `user` a partir do `schema.prisma`.
- Gerar a primeira migração em `prisma/migrations/<timestamp>_init/`.

> Se aparecer erro de conexão, confira se o Postgres está rodando e se a `DATABASE_URL` está correta. Veja [§8](#8-troubleshooting).

### 3.4 Criar o admin inicial (seed)

```bash
yarn db:seed
```

Saída esperada:

```
✅ Admin pronto: seu@email.com (id=1)
```

Esse usuário foi criado com a senha que você definiu em `ADMIN_PASSWORD`.

### 3.5 Subir a API

```bash
yarn dev
```

Saída esperada:

```
-------------------------------------

🟢  APPLICATION:    ProxyMarket API
🟢  STATUS:         RUNNING
🟢  MODE:           LOCAL
🟢  PORT:           3333
🟢  VERSION:        0.1.0

-------------------------------------
```

A API agora está em `http://localhost:3333/api`. Deixe esse terminal aberto.

---

## 4. Frontend — primeira inicialização

**Abra um novo terminal** (mantenha o backend rodando).

```bash
cd proxymarket/frontend
```

### 4.1 Criar o `.env` (opcional)

O frontend funciona sem `.env` no setup padrão. Crie um só se quiser customizar:

```bash
cp .env.example .env
```

Variáveis úteis:

| Variável | Quando usar |
|----------|-------------|
| `VITE_BASE_PATH` | Se a SPA for servida em subcaminho (ex.: `/proxymarket/`). Para dev local, deixe vazio. |
| `VITE_APP_API_BASE_URL` | Só se a API estiver em outro domínio (URL absoluta `https://...`). Para dev local, deixe vazio — o Vite faz proxy de `/api` automaticamente. |

### 4.2 Instalar dependências

```bash
yarn install
```

### 4.3 Subir a SPA

```bash
yarn dev
```

Saída esperada:

```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

A linha **Network** é o endereço para acessar de outro dispositivo na mesma rede (veja [§7.1](#71-acesso-de-outro-dispositivo-na-mesma-rede)).

---

## 5. Verificar que tudo funciona

Com backend e frontend rodando:

### 5.1 Health check da API

```bash
curl http://localhost:3333/api/actuator/health
```

Resposta esperada: `"ok"`

### 5.2 Documentação Swagger

Abra no navegador: **http://localhost:3333/documentation**

Você verá os endpoints `auth/*`, `user/*` e `actuator/health`.

### 5.3 Primeiro login

Abra no navegador: **http://localhost:5173/entrar**

- **E-mail:** o valor de `ADMIN_EMAIL` no `.env` do backend.
- **Senha:** o valor de `ADMIN_PASSWORD` no `.env` do backend.

Após login, você cai no Dashboard com 3 cards placeholder.

> Se o login falhar com "Credenciais inválidas", confirme que você rodou `yarn db:seed` e que o e-mail/senha digitados batem com o `.env`.

---

## 6. Sequência rápida (TL;DR)

Para quem já leu e quer só os comandos:

```bash
# Banco (uma vez)
docker run --name proxymarket-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=proxymarket -p 5432:5432 -d postgres:16

# Backend (terminal 1)
cd proxymarket/backend
cp .env.example .env
# ⚠️ Editar .env: DATABASE_URL, AUTH_JWT_*_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
yarn install
npx prisma migrate dev --name init
yarn db:seed
yarn dev

# Frontend (terminal 2)
cd proxymarket/frontend
yarn install
yarn dev
```

Abrir: http://localhost:5173/entrar

---

## 7. Comandos do dia a dia

Já configurado, próximas vezes que for trabalhar no projeto:

### Subir o ambiente completo

```bash
# Terminal 1
cd proxymarket/backend && yarn dev

# Terminal 2
cd proxymarket/frontend && yarn dev
```

### 7.1 Acesso de outro dispositivo na mesma rede

Para testar ou usar o app em **outro computador, tablet ou celular** na mesma Wi-Fi/LAN **sem instalar Node, yarn ou Postgres** nesse dispositivo:

1. **Na máquina de desenvolvimento**, suba backend e frontend como de costume (dois terminais).
2. No terminal do frontend, copie a URL da linha **Network** (ex.: `http://192.168.0.42:5173/`).
3. **No outro dispositivo**, abra essa URL no navegador (ex.: `http://192.168.0.42:5173/entrar`).
4. Faça login com `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env` do backend.

> O Postgres e a API continuam rodando **somente na máquina dev**. O outro dispositivo só precisa de um navegador; as chamadas `/api` passam pelo proxy do Vite na mesma origem.

**Descobrir o IP local (Windows):**

```powershell
ipconfig
```

Use o **Endereço IPv4** da interface Wi-Fi ou Ethernet ativa (geralmente `192.168.x.x`).

**Firewall do Windows:**

Se a página não carregar no outro dispositivo, libere a porta **5173** (entrada):

1. Abra **Firewall do Windows Defender** → **Permitir um aplicativo ou recurso**.
2. Localize **Node.js** (ou adicione o executável do Node) e marque **Privado** (rede local).
3. Alternativa: **Configurações avançadas** → **Regras de entrada** → Nova regra → Porta → TCP **5173** → Permitir conexão → Perfil **Privado**.

> **Não é necessário** expor a porta **3333** externamente. O proxy do Vite encaminha `/api` para o backend em `127.0.0.1:3333` na máquina dev.

**Não defina** `VITE_APP_API_BASE_URL` apontando para `http://IP:3333` — isso quebra cookies de autenticação (origens diferentes). Deixe vazio para usar o proxy relativo `/api`.

**Troubleshooting (LAN):**

- Página não abre → firewall bloqueando porta 5173 ou dispositivos em redes diferentes (ex.: convidado vs. principal).
- Login ou API falham → confirme que backend e frontend estão rodando na máquina dev.
- Erro de rede nas requisições → use a URL **Network** do Vite, não `localhost` (localhost no outro PC aponta para ele mesmo).

### Quando o `schema.prisma` muda (novos modelos, campos)

```bash
cd proxymarket/backend
npx prisma migrate dev --name <descricao-curta>   # cria + aplica a migração
# Ex.: npx prisma migrate dev --name add_proxy_table
```

### Resetar o banco do zero (perde todos os dados)

```bash
cd proxymarket/backend
npx prisma migrate reset
yarn db:seed
```

### Inspecionar o banco visualmente

```bash
cd proxymarket/backend
npx prisma studio
```

Abre uma interface web em `http://localhost:5555` para navegar pelas tabelas.

### Rodar testes

```bash
cd proxymarket/backend
yarn test          # roda uma vez
yarn test:watch    # modo watch
```

### Verificar lint e build antes de fechar uma tarefa

```bash
# Backend
cd proxymarket/backend
yarn lint
yarn build

# Frontend
cd proxymarket/frontend
yarn lint
yarn build
```

> Essas duas verificações são exigidas pela regra geral em `AGENTS.md` ("rode `yarn lint` e `yarn build` antes de dar a tarefa como concluída").

---

## 8. Troubleshooting

### "Can't reach database server" no `prisma migrate`

- O Postgres não está rodando: `docker ps` para conferir o container, ou `pg_isready -h 127.0.0.1` para Postgres nativo.
- A `DATABASE_URL` está apontando para o host errado: confirme `127.0.0.1` (não `localhost`, que às vezes resolve para IPv6 e falha).
- Porta diferente de 5432: ajuste no `DATABASE_URL`.

### "Invalid environment variables" no `yarn dev`

O env loader (Zod) recusou alguma variável obrigatória. A saída mostra exatamente qual:

```
Invalid environment variables {
  DATABASE_URL: { _errors: [ 'Required' ] },
  ...
}
```

Confira o `.env` e relance.

### "CSRF token inválido ou ausente" no frontend

Acontece quando o cookie `csrf_token` não foi setado (ex.: primeiro acesso, ou sessão muito antiga). O interceptor do Axios já trata isso automaticamente fazendo um `auth/refresh` e repetindo a requisição. Se persistir, deslogue e logue novamente.

### Login retorna 401 mesmo com senha certa

- Verifique se `yarn db:seed` foi executado (sem ele, não existe usuário no banco).
- Confirme que `ADMIN_EMAIL` no `.env` é exatamente o que você está digitando (sem espaços, em minúsculas).
- A senha do `.env` tem que ter no mínimo 8 caracteres.

### `yarn install` falha com erro do `prisma generate`

- Provavelmente faltou rodar o `npm install -g yarn` antes, ou Yarn 2+ está sendo usado. Garanta Yarn Classic (1.22.x): `yarn --version`.
- Se o erro for "Cannot find module '@prisma/adapter-pg'", rode `yarn install` de novo — às vezes o `postinstall` roda antes do `node_modules` estar completo.

### Porta 3333 ou 5173 já em uso

- Backend: mude `PORT` no `.env` e ajuste o proxy do Vite (`frontend/vite.config.ts`) para o mesmo número.
- Frontend: rode com porta diferente: `yarn dev --port 5174`.

### `npx prisma studio` não abre

- Confira que `DATABASE_URL` está no `.env` e a migração foi aplicada.
- Tente acessar manualmente `http://localhost:5555`.

---

## 9. Estrutura mínima esperada após o setup

```
proxymarket/
├── backend/
│   ├── .env                              # ✅ você criou
│   ├── node_modules/                     # ✅ yarn install
│   └── prisma/
│       ├── generated/prisma/             # ✅ prisma generate (rodou no postinstall)
│       └── migrations/<timestamp>_init/  # ✅ prisma migrate dev
└── frontend/
    ├── .env                              # opcional
    └── node_modules/                     # ✅ yarn install
```

Se algum desses não existe, volte ao passo correspondente.
