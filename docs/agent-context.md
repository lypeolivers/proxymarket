# ProxyMarket — Contexto vivo para agentes

> Este arquivo é o **documento de inteligência** do projeto. Concentra o que um agente precisa saber **além** do código e do [AGENTS.md](../AGENTS.md): vocabulário do negócio, decisões já tomadas, próximos passos e perguntas em aberto.
>
> **Regra de ouro:** ao tomar uma decisão arquitetural ou de domínio durante uma conversa, **registre uma linha** na seção [Decisões](#decisoes) antes de encerrar o turno. Ao descobrir algo reutilizável (lib testada e descartada, peculiaridade da API, etc.), registre em [Aprendizados](#aprendizados-dos-agentes).
>
> Quando este arquivo passar de ~500 linhas ou quando alguma seção dominar o resto, quebrar em `docs/domain.md`, `docs/decisions.md`, `docs/roadmap.md`.

---

## 1. Visão do produto

- **Nome:** ProxyMarket.
- **Dono:** vendedor solo de proxys (cartas personalizadas) atualmente operando via planilhas.
- **Objetivo de curto prazo:** substituir as planilhas por uma plataforma web que organize catálogo, pedidos e clientes.
- **Objetivo de médio prazo:** ganhar tempo e visibilidade para escalar o negócio (métricas, automações, possíveis features para os compradores).
- **Modelo de uso atual:** **admin único** — só o dono acessa. Multi-usuário/multi-tenant não está no escopo inicial.
- **Idioma do produto:** português (PT-BR) para UX e rotas; código em inglês.

> Quando o escopo evoluir (ex.: dois sócios usando, ou clientes acessando um portal), atualize esta seção **antes** de mexer na arquitetura.

---

## 2. Domínio e vocabulário <a id="dominio"></a>

Definições oficiais usadas neste projeto. Quando um termo aparecer no código (modelos Prisma, schemas Zod, componentes React), ele deve bater com a definição abaixo.

| Termo | Definição preliminar | Notas |
|-------|---------------------|-------|
| **Proxy** | Carta personalizada (impressa ou digital) que reproduz/inspira uma carta de jogo. No sistema, modelada como **`Card`** com `tcg` (One Piece, Magic, Pokémon), `card_type` (variante por jogo), `name`, `edition` (quando aplicável), `colors` (0–2 cores só para líder One Piece) e `status`. | Precificação, estoque e variações físicas (foil, acabamento) ficam para o módulo de vendas/catálogo comercial. |
| **Pedido (Order)** | Encomenda vinculada a um **Customer** e a um ou mais itens de **Card** (`OrderItem`). Cada item tem `quantity`, `unit_price` e `art_status` (arte a fazer → impresso). Cabeçalho: **`order_date`** (data comercial, usada em agregações do dashboard), **`order_status`** (pipeline de 6 etapas: orçamento, pagamento parcial, pago, aguardando pagamento, pronto para a entrega, entregue), `delivery_method` quando aplicável (obrigatório ao marcar **entregue**). Total calculado pela soma dos itens (não persistido). | Produção de arte só após sair de **orçamento** (`quote`). Rota UI `/pedidos`; API `/order`. |
| **Cliente (Customer)** | Comprador reutilizável (`name`, `phone`, `email`, `city`, `state` UF válida brasileira, `notes`). | Rota UI `/clientes`; API `/customer`. |
| **Catálogo** | Conjunto de proxys disponíveis para venda. | A definir: estados (rascunho, ativo, esgotado, descontinuado). |
| **Admin** | Único usuário do sistema (o dono). Usa o app para gerenciar tudo. | Modelado pelo `User` no Prisma. Sem perfis/permissões. |

> Quando uma entidade for modelada no Prisma, **atualize a linha correspondente** com os campos definitivos e remova "A definir".

### Fluxos de negócio (alto nível, a serem detalhados)

1. **Cadastrar proxy no catálogo** → admin define nome, preço, imagem, variações.
2. **Registrar uma venda** → admin lança um pedido vinculado a cliente + proxys + valor total + status.
3. **Acompanhar pedidos** → dashboard com vendas do mês, pendências, próximos envios.
4. **Cadastrar/atualizar cliente** → manter histórico para vendas recorrentes.

---

## 3. Decisões <a id="decisoes"></a>

Lista append-only. Cada entrada: data, decisão, contexto curto. Se uma decisão for revertida, **não apague** — adicione uma nova entrada marcando "Substitui #N".

### 2026-05-13 — D1: Single-admin, sem perfis/permissões

- **Contexto:** ProxyMarket é usado só pelo dono. Não há colaboradores nem clientes acessando a plataforma.
- **Decisão:** modelar apenas um `User` no Prisma; `verifyAccessToken` é o único middleware de autenticação; nenhuma camada de `verifyApiPermission` ou tabela `Profile`/`UserProfile`.
- **Gatilho para revisar:** quando aparecer o primeiro segundo usuário (sócio, assistente, cliente com login).

### 2026-05-13 — D2: Infraestrutura mínima (sem S3, WebSocket, LiveKit, Push, e-mail, OpenAI, Cron)

- **Contexto:** o template Teski traz muita infra pronta. Para ProxyMarket inicial, isso é peso morto.
- **Decisão:** scaffold só com Fastify + Prisma + Zod + JWT + CSRF + Swagger. Plugins de upload/realtime ficam de fora.
- **Gatilho para revisar:**
  - **S3:** quando precisar guardar imagens dos proxys em produção (no dev pode ficar em filesystem local).
  - **WebSocket / Push:** quando houver notificações em tempo real ou portal do cliente.
  - **E-mail:** quando enviar confirmação de pedido ao cliente.

### 2026-05-13 — D3: Documento único `docs/agent-context.md` em vez de pasta `docs/` com vários arquivos

- **Contexto:** projeto em estágio muito inicial; pouca informação acumulada.
- **Decisão:** começar com um único documento de inteligência. Quebrar em arquivos separados (`domain.md`, `decisions.md`, `roadmap.md`) só quando este passar de ~500 linhas.
- **Gatilho para revisar:** ao perceber que o arquivo está difícil de navegar ou que seções específicas estão crescendo desproporcionalmente.

### 2026-05-14 — D4: Paleta verde-floresta (tema visual)

- **Contexto:** o produto abandonou o tom roxo/lavanda do template inicial em favor de uma identidade mais alinhada ao mercado de cards.
- **Decisão:** tokens em `frontend/src/index.css` usam fundos profundos esverdeados (`--bg`, `--bg-deep`, etc.) e acentos `--moss` / `--leaf`; shadcn mapeia `--primary` e sidebar a partir desses tokens.
- **Gatilho para revisar:** rebranding, modo claro, ou necessidade de contraste AA em novos componentes.

### 2026-05-14 — D5: Modelo `Card` único com validação por TCG/tipo (Zod)

- **Contexto:** cadastro de proxys no catálogo precisa de campos diferentes por jogo (One Piece líder vs DON, Magic, Pokémon).
- **Decisão:** uma tabela Prisma `card` com colunas nulificáveis (`name`, `edition`, `colors[]`); regras por combinação `tcg` + `card_type` na API via schemas Zod (union discriminada por `card_type`). CRUD REST em `/card` (lista paginada, soft delete).
- **Gatilho para revisar:** novos TCGs, tipos adicionais, ou necessidade de normalizar sub-entidades (ex.: edições como tabela de referência).

### 2026-05-14 — D6: Pedidos (`Order`/`OrderItem`) com gate de pagamento e clientes reutilizáveis

- **Contexto:** operação em planilha por nome do cliente, linhas de carta com quantidade/preço, status de arte e de entrega; orçamento até confirmação de pagamento (total ou 50%).
- **Decisão:** módulos `customer` e `order`; itens referenciam `Card`; totais calculados na API; controle de avanço do fluxo no cabeçalho do pedido; `GET /order/stats` alimenta o dashboard; rota UI `/pedidos`.
- **Gatilho para revisar:** gateway de pagamento, valor exato pago, frete, portal do cliente ou importação de planilha.

### 2026-05-15 — D12: Pipeline único de status do pedido (`OrderPipelineStatus`)

- **Contexto:** o par `payment_status` + `fulfillment_status` duplicava conceitos, gerava ambiguidade (ex.: “em envio” vs “pronto para envio”) e poluía filtros e a listagem.
- **Decisão:** um único **`order_status`** com seis valores (`quote`, `partial_payment`, `paid`, `awaiting_payment`, `ready_for_delivery`, `delivered`); transições só para frente na API (sem reabrir pedido entregue); **`delivery_method`** permanece para Correios / entrega pessoal e é **obrigatório** ao atingir **entregue**; migração SQL mapeia dados antigos (ex.: `in_shipping` → `ready_for_delivery`). KPIs do dashboard e filtro da lista usam esse pipeline.
- **Gatilho para revisar:** gateway de pagamento, devoluções, ou etapas extras (ex.: postagem rastreada como subestado).

### 2026-05-14 — D7: UX escalável para pedidos e localização do cliente

- **Contexto:** listagens de clientes e cartas crescem; chips ocupam espaço demais e escondem opcões; organização por envios beneficia cidade/UF.
- **Decisão:** formulário `/pedidos` usa **Radix Select** (`@radix-ui/react-select`) para cliente e carta por linha, com filtros client-side onde já existia texto; seleção de carta mostra **indicadores de cor** das `Card.colors`. Cliente ganha campos opcionais `city` / `state` (UF contra lista brasileira) + busca pela API em nome/e-mail/telefone/cidade/UF; listagem de **clientes e cartas** aceita até **500** registros por request.
- **Gatilho para revisar:** catálogo muito grande (buscar cartas servidor-side com debounce), endereços completos, CEP/API IBGE automática.

### 2026-05-14 — D8: Lista de pedidos com prévia de linhas + modo Painel na UI

- **Contexto:** a UX em grade precisa ver cartas/cores/status de arte sem um `GET /order/:id` por pedido (N+1).
- **Decisão:** `GET /order` devolve cada `OrderSummary` com array **`lines`** (itens não excluídos: `quantity`, `unit_price`, `line_total`, `art_status`, snapshot compacto da **`card`**). Na página `/pedidos`, toggle **Lista** / **Painel** mostra a mesma fonte de dados em tabela ou em cards com destaque por `order_status`, área interna rolável, expansão para observações e **Copiar resumo** (PT-BR).
- **Gatilho para revisar:** catálogo de pedidos muito grande por página (reduzir `limit`, campos opcionais via query ou endpoint slim).

### 2026-05-14 — D9: Linhas de pedido compactáveis + seleção de carta por linha (Popover)

- **Contexto:** buscar carta num campo único no topo não escalava com várias linhas e não incentivava revisão antes de salvar.
- **Decisão:** cada linha do formulário `/pedidos` usa `OrderLineCardCombobox` (Radix **Popover** + busca local no painel); removida busca global de cartas na página. Linhas podem ser **confirmadas** (`line_confirmed`) para modo compacto com borda por status de arte; **Cadastrar/Salvar** só prossegue com todas as linhas confirmadas. Substitui, para a escolha de carta no pedido, o uso de Select por linha mencionado em D7 (cliente continua em Radix Select).
- **Gatilho para revisar:** catálogo muito maior que ~500 itens carregados (debounce + API de busca), ou fluxo que precise salvar rascunho sem confirmar linhas.

### 2026-05-15 — D10: Filter bar com Select + CRUD em Dialog (Radix)

- **Contexto:** chips de filtro e formulários em `Card` no topo consumiam espaço vertical e fragmentavam o layout entre módulos.
- **Decisão:** listagens em `/cartas` e `/pedidos` usam **uma barra superior** com **Radix Select** (incl. modo de visualização em pedidos); cadastro/edição em `/cartas`, `/clientes` e `/pedidos` abre em **`Dialog`** (`@radix-ui/react-dialog`) com **overlay em desfoque**, corpo rolável e fechamento (overlay, Esc, X) que dispara o mesmo reset que `closeForm()`. Componente compartilhado em `frontend/src/components/ui/dialog.tsx`.
- **Gatilho para revisar:** novo padrão de filtros (ex.: múltipla seleção), ou modais empilhados (confirmações) que exijam `AlertDialog` separado.

### 2026-05-16 — D11: Ação Visualizar nas listagens (detalhe em Dialog só leitura)

- **Contexto:** listas devem focar dados principais; campos opcionais (ex.: observações) e linhas completas sobrecarregam a grade.
- **Decisão:** em `/cartas`, `/clientes` e `/pedidos`, botão **Visualizar** (`Eye`, antes de Editar) abre **`Dialog`** read-only específico do módulo em `frontend/src/modules/{card,customer,order}/components/*-detail-dialog.tsx`. Texto PT-BR. Pedidos: texto **Copiar resumo** compartilha [`buildOrderSummaryClipboardText`](frontend/src/modules/order/lib/order-summary-text.ts). Novos CRUD devem repetir esse padrão.
- **Gatilho para revisar:** necessidade de rota página de detalhe (`/:id`), PDF ou impressão — dialog pode migrar ou coexistir.

### 2026-05-16 — D13: Dashboard — Insights + faturamento mensal (Recharts)

- **Contexto:** o dono precisa de rankings rápidos (melhor cliente, carta mais vendida, volume por cliente) e visão de evolução do faturamento sem exportar planilha.
- **Decisão:** `GET /order/stats` inclui `insights` (três tops) e `revenue_by_month` (12 pontos `YYYY-MM`, soma de linhas, **UTC**); pedidos em **`quote`** ficam fora dessas métricas. O KPI **receita do mês** e os buckets da série mensal usam a **data comercial** `order_date`, não `created_at` (ver D14). Implementação: SQL agregado em [`get-order-stats.service.ts`](../backend/src/modules/order/services/get-order-stats.service.ts); série completa com zeros em [`stats-month-series.ts`](../backend/src/modules/order/services/stats-month-series.ts); no frontend, **Insights** e gráfico em [`DashboardPage.tsx`](../frontend/src/pages/DashboardPage.tsx) com **Recharts**.
- **Gatilho para revisar:** fuso horário exibido (hoje UTC no texto do dashboard), período configurável, ou dashboards por loja/usuário.

### 2026-05-16 — D14: Data comercial do pedido (`order_date`) vs auditoria (`created_at` / `updated_at`)

- **Contexto:** pedidos podem ser cadastrados retroativamente; agregar faturamento por `created_at` desloca receita para o mês errado.
- **Decisão:** campo **`order_date`** no Prisma (`@db.Date`), obrigatório no create/update e editável no PATCH; migração inicial copia `created_at` (UTC) para `order_date`. **Receita do mês** e **série de faturamento** em `GET /order/stats` usam `order_date` (alinhado à série em UTC em [`stats-month-series.ts`](backend/src/modules/order/services/stats-month-series.ts)); `created_at` / `updated_at` permanecem só para auditoria. Formulário `/pedidos`: seletor de data com default **hoje** (calendário local).
- **Gatilho para revisar:** fechamento fiscal em fuso diferente ou critério de “mês” distinto do calendário UTC usado hoje.

---

## 4. Roadmap

### Estado atual (2026-05-16)

- ✅ Scaffold backend (`auth`, `user`, `health`) + frontend (login, logout).
- ✅ Banco com `User` mínimo + seed do admin.
- ✅ Guias `AGENTS.md` (raiz e backend) + `README.md`.
- ✅ Documentação em `docs/`: `agent-context.md` (este arquivo) e `setup-guide.md` (passo a passo de inicialização).
- ✅ Tema verde-floresta aplicado no frontend (`index.css`).
- ✅ Módulo `card` + página `/cartas`.
- ✅ Módulos `customer` e `order` + páginas `/clientes` e `/pedidos`; **pipeline único** `order_status` no Prisma e na API (ver D12); **`order_date`** (data comercial) em pedidos, formulário com datepicker e métricas de faturamento alinhadas (ver D14); dashboard com KPIs e **Insights** (tops + gráfico de faturamento 12 meses) via `/order/stats` (ver D13); listagem de pedidos com prévia de linhas (`lines`), filtro por **Status**, coluna de **chips** e alteração de status nas **Ações**; modo **Painel** (cards); formulário de pedido com linhas confirmáveis e combobox de carta com busca por linha (ver D9).
- ✅ UX: **filter bar** com Select em cartas/pedidos e **formulários de CRUD em Dialog** com overlay em desfoque em cartas, clientes e pedidos (ver D10).
- ✅ Ação **Visualizar** (detalhe somente leitura em Dialog + atalho **Editar**) em cartas, clientes e pedidos (ver D11).

### Próximos passos sugeridos (ordem natural)

1. **Evoluir catálogo comercial** a partir de `Card`: imagens, variações físicas, preço padrão sugerido ao montar pedidos.
2. **Importar dados das planilhas atuais** (script de migração único).
3. **Integrações** (pagamento, etiquetas, relatórios) conforme parking lot.

> Cada passo segue o padrão modular descrito em [`backend/AGENTS.md`](../backend/AGENTS.md). Antes de começar, alinhar campos/regras com o dono nesta seção.

### Parking lot (ideias sem prazo)

- Geração de etiquetas de envio.
- Integração com gateway de pagamento (Pix, Mercado Pago, etc.).
- Portal público para clientes acompanharem pedidos.
- Exportar relatórios em Excel/PDF.
- Histórico de preços por proxy.
- Calculadora de margem por venda.

---

## 5. Perguntas em aberto

Lista de perguntas que precisam de resposta do dono **antes** de implementar a feature relacionada. Quando responder, mova a entrada para [Domínio](#dominio) ou [Decisões](#decisoes) e remova daqui.

- [ ] Como você precifica um proxy hoje? (preço fixo, por unidade, por tipo de carta, por lote?)
- [ ] Existem variações de produto? (foil/normal, tamanhos, acabamentos diferentes?)
- [ ] Quais informações de cliente você guarda além do cadastro atual? (endereço, redes sociais?)
- [ ] Frequência de pedidos hoje (por mês)? Vai mudar com a plataforma?
- [ ] Há sazonalidade clara (lançamentos de jogos, eventos, datas específicas)?

---

## 6. Aprendizados dos agentes <a id="aprendizados-dos-agentes"></a>

Registro de descobertas reutilizáveis. **Não é changelog** — é "coisas que custaram tempo descobrir e que se perdidas vão custar de novo".

### 2026-05-13 — Padrões herdados do Teski

- O Teski usa `adapter-pg` do Prisma (não o driver padrão). Mantivemos no ProxyMarket — necessário porque o Prisma 6 com Postgres exige adapter explícito em alguns setups.
- Cookie CSRF (`csrf_token`) é intencionalmente `httpOnly: false` — esse é o padrão "double-submit", o frontend precisa ler e reenviar como header `X-CSRF-Token`.
- Em `routes/routes.ts`, o cast `const http = app as any` é necessário porque o tipo genérico do Fastify não combina bem com os tipos derivados de Zod nos handlers. Não tente "consertar" — está documentado no ESLint do backend.
- `runInTransaction(callback, userId)` registra `app.current_user_id` no Postgres via `set_config`. Hoje não usamos (não há auditoria), mas o helper está pronto para quando precisar.

### 2026-05-16 — Prisma: `order_status`, `DROP DEFAULT` e drift

- A migração `20260516120000_order_pipeline_status` faz `ALTER ... DROP DEFAULT` após copiar dados — estado final **sem default SQL** na coluna. O `schema.prisma` usa `@default(quote)`, então o Prisma espera **default no banco** alinhado ao schema.
- Se o banco ficar só com um dos lados (default manual / migração acidental), `migrate dev` pode reportar **drift** ou gerar migração com timestamp fora de ordem — **evitar** `migrate dev --name foo` sem revisar a pasta criada.
- Correção estável: migração **depois** de `order_date` que define `SET DEFAULT 'quote'::"OrderPipelineStatus"` (ex.: `20260516210500_order_status_db_default`), para replays e clones ficarem iguais ao schema. Scripts em `backend/prisma/scripts/` podem reparar só `_prisma_migrations` quando uma pasta é removida do repo.

<!-- Próximo aprendizado:

### YYYY-MM-DD — Título curto

Contexto e descoberta.

-->

---

## 7. Como usar este documento

**Lendo (você ou agente novo na conversa):**
1. Comece pelo [AGENTS.md](../AGENTS.md) (arquitetura e regras).
2. Volte aqui para entender **o negócio e o estado atual**.
3. Confira [Perguntas em aberto](#5-perguntas-em-aberto) — se a feature pedida depende de uma resposta, peça-a antes de codar.

**Escrevendo (agente fechando uma tarefa):**
1. Tomou decisão arquitetural ou de domínio? → adicione em [Decisões](#decisoes).
2. Descobriu algo não-trivial? → adicione em [Aprendizados](#aprendizados-dos-agentes).
3. Implementou uma feature? → atualize [Estado atual](#estado-atual-2026-05-16).
4. Novo termo de negócio entrou no código? → adicione em [Domínio](#dominio).

Manter este doc **honesto e atualizado** é mais importante do que torná-lo bonito.
