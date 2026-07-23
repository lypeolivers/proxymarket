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
| **Proxy** | Carta personalizada (impressa ou digital) que reproduz/inspira uma carta de jogo. No sistema, modelada como **`Card`** com `tcg` (One Piece, Magic, Pokémon), `card_type` (variante por jogo), `name`, `edition` (quando aplicável), `colors` (0–2 cores só para líder One Piece) e `status`. | Precificação e variações físicas comerciais (foil, acabamento) seguem evolução do catálogo; **saldo físico pronto** em **`CardStock`** / rota `/estoque`. |
| **Estoque (`CardStock`)** | Quantidade **pronta** (unidades impressas/disponíveis) por **`Card`**, em linha opcional `card_stock` (`quantity` ≥ 0, soft delete). API **`GET/PATCH /stock`**, **`GET /stock/graphic-summary`**; UI **`/estoque`** com tabela de saldo/demanda e painel **pedidos com impressão pendente** (`GET /order/print-backlog`). | Demanda para gráfica exclui `quote`, `delivered`, `fulfill_from_stock` e arte `printing`/`printed` (D16, D22). Estoque ajustado **manualmente** (D28). |
| **Pedido (Order)** | Encomenda vinculada a um **Customer** e a um ou mais itens de **Card** (`OrderItem`). Cabeçalho: **`order_date`**, **`order_status`**, `delivery_method`. Totais de pagamento: **`amount_paid`**, **`amount_due`**, **`is_fully_paid`** (soma de **`OrderPayment`** — D26). Itens: modelo opcional (D21), **`fulfill_from_stock`** (D22), produção manual (D19). Filtro lista por **UF** do cliente (D25). Rota UI `/pedidos`. | Pagamentos não alteram `order_status` automaticamente. |
| **Pagamento (`OrderPayment`)** | Lançamento de valor recebido: **`amount`**, **`collected_at`** (data de recolhimento), `notes` opcional. Vários por pedido. API CRUD em **`/order/:id/payment`**. | Dashboard e KPI “Recebido no mês” usam `collected_at` (D26). |
| **Modelo de impressão (`CardPrintModel`)** | Por **`Card`**: nome do modelo + **`file_name`** (rótulo para a gráfica). CRUD em **`/card-print-model`**; UI **`/modelos-carta`**. | Migração criou modelo **Legado** por carta usada em itens antigos. |
| **Remessa de produção (`ProductionShipment`)** | Agrupa linhas de pedido para envio à gráfica: **`display_number`** sequencial (#N), **`status`** `awaiting_print` → `printing` → `printed`. API **`GET /production/shipment`**, **`POST /production/shipment`**, **`PATCH /production/shipment/:id`**, **`PATCH .../move`**, **`PATCH .../remove-from-production`** (tira a linha da remessa sem apagar o pedido), PATCH arte por linha, **`GET .../graphic-summary`**. UI **`/producao`**. | Só pode existir **uma** remessa em **`awaiting_print`** (ver D18). Entrada na remessa via **Enviar para produção** em Pedidos (ver D19). |
| **Cliente (Customer)** | Comprador reutilizável (`name`, `phone`, `email`, `city`, `state` UF válida brasileira, `notes`). Pode ter **brindes** (`CustomerGift`: X cartas grátis genéricas). | Rota UI `/clientes`; API `/customer`. |
| **Catálogo** | Conjunto de proxys disponíveis para venda. | A definir: estados (rascunho, ativo, esgotado, descontinuado). |
| **Admin** | Único usuário do sistema (o dono). Usa o app para gerenciar tudo. | Modelado pelo `User` no Prisma. Sem perfis/permissões. |

> Quando uma entidade for modelada no Prisma, **atualize a linha correspondente** com os campos definitivos e remova "A definir".

### Fluxos de negócio (alto nível, a serem detalhados)

1. **Cadastrar proxy no catálogo** → admin define nome, preço, imagem, variações.
2. **Registrar uma venda** → admin lança um pedido vinculado a cliente + proxys + valor total + status.
3. **Acompanhar pedidos** → dashboard com vendas do mês, pendências, próximos envios.
4. **Cadastrar/atualizar cliente** → manter histórico para vendas recorrentes.
5. **Controlar estoque físico** → lançar saldo por carta na UI `/estoque`; comparar com demanda dos pedidos para priorizar produção.

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

### 2026-05-18 — D15: Estoque físico (`CardStock`) e regra de demanda para pedidos abertos

- **Contexto:** o dono precisa saber quantas unidades **já estão prontas** por SKU (`Card`) e o quanto os **pedidos em aberto** consomem dessa capacidade, sem misturar com status de arte/impressão por linha (`OrderItem.art_status`).
- **Decisão:** tabela **`card_stock`** 1:1 com `card`; módulo **`stock`** com `GET /stock` (lista cartas + `on_hand`, `demand_open`, `demand_quote`, `available_after_orders`, `need_to_produce`) e `PATCH /stock/:cardId` para definir `quantity`. **`demand_open`** soma `OrderItem.quantity` em pedidos cujo `order_status` **não** é `quote` nem `delivered` (linhas e pedidos não excluídos). **`demand_quote`** soma apenas pedidos em **`quote`** (referência / pipeline). Evolução em **D16** (baixa ao entregue, colunas gráfica e `GET /stock/graphic-summary`).
- **Gatilho para revisar:** ação **Dar baixa manual** na expedição sem entregar; FIFO ou lotes; integração com picking.

### 2026-05-19 — D16: Baixa de estoque ao entregar + resumo para gráfica

- **Contexto:** o dono envia listas à gráfica excluindo o que já está em impressão/impresso e precisa que o saldo físico reflita entregas; antes (D15) não havia baixa automática.
- **Decisão:** (1) Na **primeira** transição do pedido para **`delivered`** (`PATCH`/`PUT` em transação), reduzir **`CardStock.quantity`** por `card_id` somando quantidades das linhas não excluídas; **`nova = max(0, atual − qtd)`** por carta. (2) **`demand_pending_print`**: mesma base de pedidos que `demand_open`, porém **exclui** linhas com `art_status` **`printing`** ou **`printed`**. (3) **`need_for_graphic` = max(0, demand_pending_print − on_hand)`**. (4) **`GET /stock/graphic-summary`**: lista consolidada + **`clipboard_text`** em PT-BR (inclui linha **Total de unidades** no final) + campo **`total_units`** para consumo programático.
- **Gatilho para revisar:** baixa proporcional só para linhas `printed`; necessidade de relatório consolidado global na UI (endpoint global permanece).

### 2026-05-18 — D17: Modelos de impressão, remessas de produção e gate de arte na Produção

- **Contexto:** o dono precisa de arquivo por variante de carta, lotes explícitos para a gráfica e um lugar único para alternar arte **a fazer / pronta** sem misturar com o fluxo de pedido.
- **Decisão:** **`CardPrintModel`** por carta (`name`, `file_name`); **`ProductionShipment`** com `display_number` único e status **`awaiting_print` | `printing` | `printed`**; **`OrderItem`** passa a ter FKs **`card_print_model_id`** e **`production_shipment_id`**. Ao **criar/atualizar pedido**, validar modelo pertencente à carta e associar itens à **única** remessa em **`awaiting_print`** (criar se não existir; **409** se houver duplicidade). **`PATCH /order/:id/items/:itemId`** não aceita mais `art_status`. **`GET /order?q`** também filtra por nome/edição da carta nas linhas. UI: **`/modelos-carta`**, **`/producao`** (copiar resumo por remessa); pedidos exibem modelo e arte só leitura; estoque sem botão de cópia global do resumo (ver D16).
- **Gatilho para revisar:** múltiplas remessas abertas por política operacional; permissões se surgir equipe.

### 2026-05-18 — D18: Remessa manual, mover linha entre remessas e Produção sem “pulo” ao mudar arte

- **Contexto:** pedidos já **concluídos** precisam entrar em remessas de arquivo; às vezes uma linha ficou na remessa errada; ao alternar **arte a fazer / pronta** a página recarregava a lista e perdia scroll.
- **Decisão:** (1) **`POST /production/shipment`** com `status` opcional (padrão `awaiting_print`); mesma regra de unicidade da remessa aberta (**409** se já houver `awaiting_print`). (2) **`PATCH /production/shipment/:targetId/order-item/:itemId/move`** atualiza só **`production_shipment_id`**. (3) Resposta do PATCH de arte inclui **`art_status`**; na UI **`/producao`**, recarregar lista **sem** spinner ao mudar status da remessa ou criar/mover; ao togglar arte, só atualizar a linha no estado local (sem reload completo).
- **Gatilho para revisar:** auditoria de quem moveu o quê (histórico).

### 2026-06-03 — D19: Envio manual à produção e remoção de linha da remessa

- **Contexto:** pedidos em orçamento são editados por dias; associar itens à remessa aberta ao salvar gerava ruído na gráfica e obrigava “remessa lixo” para corrigir erros.
- **Decisão:** (1) **`production_shipment_id`** nullable em **`OrderItem`**; criar/atualizar pedido deixa linhas **sem remessa**. (2) **`POST /order/:id/send-to-production`** envia apenas linhas com `production_shipment_id` null para a remessa em **`awaiting_print`**. (3) **`PATCH /production/shipment/:id/order-item/:itemId/remove-from-production`** zera a FK (linha some de `/producao`, pedido intacto). (4) UI Pedidos: badge **fora da produção**, botão **Enviar para produção**; Produção: **Remover** por linha.
- **Gatilho para revisar:** escolher remessa de destino no envio; bloquear remoção em remessa já `printed`.

### 2026-06-03 — D20: Produção só em orçamento / pagamento em curso

- **Contexto:** pedidos **aguardando pagamento**, **prontos para entrega** ou **entregues** podem ser atendidos com **estoque**; alerta “fora da produção” gerava ruído.
- **Decisão:** `pending_production_count` e UI de envio só para `order_status` em **`quote`**, **`partial_payment`**, **`paid`**. API **`send-to-production`** recusa os demais status com **400**. Demais status continuam podendo ter linhas sem remessa no banco, sem sinalização.
- **Gatilho para revisar:** marcar por linha “atender do estoque” vs “imprimir”; painel em `/estoque` com pedidos elegíveis à gráfica.

### 2026-06-03 — D21: Modelo de impressão opcional no pedido, obrigatório na produção

- **Contexto:** orçamentos de arte nova ainda sem nome de modelo/arquivo para a gráfica; exigir modelo no cadastro bloqueava o fluxo.
- **Decisão:** **`card_print_model_id`** nullable em **`OrderItem`** no CRUD do pedido; **`POST /order/:id/send-to-production`** retorna **400** (`missing-print-model`) se alguma linha pendente (não estoque, sem remessa) não tiver modelo. UI: placeholder opcional, **Modelo: pendente**, botão de envio desabilitado enquanto `missing_print_model_count` &gt; 0.
- **Gatilho para revisar:** bloquear salvar pedido `paid` sem modelo; modelo placeholder automático (Legado).

### 2026-06-03 — D22: Linha “Atender do estoque”

- **Contexto:** parte do pedido pode ser coberta com unidades já impressas, sem passar pela fila da gráfica (D20).
- **Decisão:** boolean **`fulfill_from_stock`** em **`OrderItem`** (default false). Linhas marcadas não entram em `pending_production_count`, **`send-to-production`** nem em **`demand_pending_print`** / `need_for_graphic`.
- **Gatilho para revisar:** baixa automática de estoque ao marcar linha como estoque; reserva de estoque por pedido.

### 2026-06-03 — D23: Confirmação ao avançar para “pronto para entrega”

- **Contexto:** pedido pode ir para entrega com linhas ainda fora da produção ou sem modelo.
- **Decisão:** ao escolher **`ready_for_delivery`** na UI de Pedidos, **Dialog** se houver linhas pendentes ou sem modelo: **Cancelar**, **Avançar mesmo assim**, ou **Enviar à produção e avançar** (quando elegível e sem modelo pendente). Contagem de produção em `ready_for_delivery` permanece zero (D20).
- **Gatilho para revisar:** mesma confirmação na API `PATCH` (não só UX).

### 2026-06-04 — D24: Filtro “com saldo em estoque” na UI `/estoque`

- **Decisão:** query **`in_stock_only`** em **`GET /stock`** (cartas com `card_stock.quantity > 0`); checkbox na página Estoque.

### 2026-06-04 — D25: Filtro de pedidos por UF do cliente

- **Decisão:** query **`customer_state`** (UF válida) em **`GET /order`**; `OrderSummary` expõe **`customer_state`**; Select de UF em `/pedidos`.

### 2026-06-04 — D26: Pagamentos por pedido e dashboard por recolhimento

- **Contexto:** pagamentos parciais e em datas diferentes; faturamento por mês deve refletir **quando o dinheiro entrou**, sem forçar mudança de `order_status`.
- **Decisão:** modelo **`OrderPayment`** (`amount`, **`collected_at`**, `notes`); API **`GET/POST/DELETE /order/:id/payment`**; pedido expõe **`amount_paid`**, **`amount_due`**, **`is_fully_paid`** (calculados). Dashboard: **`revenue_month`** e gráfico por **`collected_at`**; insight top cliente por recebimentos. UI de pagamentos no formulário (edição) e no detalhe (somente leitura). **Status do pipeline permanece manual** ao atingir 100% recebido.

### 2026-06-03 — D27: Dashboard operacional e financeiro ampliado

- **Contexto:** a dashboard inicial cobria pipeline e caixa, mas dados de produção, estoque e contas a receber já existiam em `/estoque` e `/producao` sem visão executiva; `items_by_art_status` vinha da API sem UI.
- **Decisão:** **`GET /order/stats`** passa a aceitar **`period_months`** (3|6|12), **`tcg`** e **`customer_state`**; resposta inclui **`amount_due_total`**, **`orders_with_balance_count`**, **`in_progress_by_status`**, **`confirmed_revenue_by_month`**, **`operations`** (unidades gráfica, backlog, linhas fora da produção/sem modelo, remessa aberta). UI em **`DashboardPage`**: filtros, KPIs clicáveis (`/pedidos?status=…`, `/estoque?graphic_need=1`, `/producao`), gráfico de barras de arte, gráfico dual pedidos vs recebido. Drill-down em Pedidos: query **`status`**, **`uf`**, **`with_balance=1`** (filtro client-side).
- **Gatilho para revisar:** aging de orçamentos, top 5 rankings, fuso America/Sao_Paulo nos KPIs mensais.

### 2026-07-22 — D30: Brindes genéricos por cliente

- **Contexto:** promoções pontuais (ex.: carta de brinde sem custo) precisavam de cadastro por cliente, visibilidade na lista e aplicação ao montar pedidos.
- **Decisão:** model **`CustomerGift`** (`quantity_granted`, `quantity_used`, `notes`); API **`GET/POST/DELETE /customer/:id/gift`**; lista de clientes expõe **`gift_units_remaining`**. Linhas de pedido podem referenciar **`customer_gift_id`** com **`unit_price = 0`**; saldo reconciliado pela soma das linhas ativas (FIFO na UI ao marcar brinde).

---

### 2026-06-12 — D29: Limpar modelo no formulário de pedidos e informações de compra do cliente

- **Contexto:** após escolher um modelo de impressão na linha do pedido, não havia como voltar a "Modelo pendente"; na tela de clientes faltava visão do histórico de compras por cliente.
- **Decisão:** (1) Select de modelo em `/pedidos` ganha item **`Modelo pendente`** (sentinela `none` → `card_print_model_id: null`). (2) **`GET /customer/:id/purchase-info`** agrega compras confirmadas (exclui `quote`): unidades, valor dos pedidos, valor pago, unidades por TCG e linhas recentes paginadas. (3) Modal **Informações** em `/clientes` (ícone Info) exibe essas métricas e tabela paginada (10 por página).

---

### 2026-06-09 — D28: Status do pedido livre, sem baixa automática de estoque e fim do controle manual de arte

- **Contexto:** alterar `order_status` no dialog de Pedidos reabria todas as linhas para edição; enganos exigiam reverter status (inclusive de entregue); baixa automática ao entregar não reflete a operação (estoque ajustado manualmente só para pronta entrega); fluxo **arte a fazer / pronta** foi substituído por modelos de carta + status da remessa (`printing` / `printed`).
- **Decisão:** (1) **`order_status`** pode mudar para **qualquer** valor na API (sem trava forward-only nem lock em `delivered`); regras de **`delivery_method`** mantidas (`quote` sem envio; `delivered` exige envio). (2) **Removida** baixa automática de **`CardStock`** ao marcar entregue (substitui item (1) de D16). (3) UI Pedidos: status via **PATCH** imediato (lista e dialog) **sem** desconfirmar linhas; popover lista todos os status. (4) **PUT** de pedido faz **sync** de linhas preservando `production_shipment_id` / `art_status` quando a linha é equivalente. (5) Removido **`PATCH .../art-status`** e toggle de arte em **`/producao`**; dashboard mostra só **Em impressão** / **Impresso**. Campo `art_status` permanece no banco para cascade da remessa e demanda gráfica.
- **Gatilho para revisar:** migração de enum removendo `art_to_do`/`art_ready`/`confirmed`; baixa seletiva por linha `fulfill_from_stock` no futuro.

---

## 4. Roadmap

### Estado atual (2026-05-18)

- ✅ Scaffold backend (`auth`, `user`, `health`) + frontend (login, logout).
- ✅ Banco com `User` mínimo + seed do admin.
- ✅ Guias `AGENTS.md` (raiz e backend) + `README.md`.
- ✅ Documentação em `docs/`: `agent-context.md` (este arquivo) e `setup-guide.md` (passo a passo de inicialização).
- ✅ Tema verde-floresta aplicado no frontend (`index.css`).
- ✅ Módulo `card` + página `/cartas`.
- ✅ Módulos `customer` e `order` + páginas `/clientes` e `/pedidos`; **pipeline único** `order_status` (D12); formulário com linhas confirmáveis, combobox de carta (D9), **modelo opcional** no orçamento e obrigatório no envio à produção (D21), flag **atender do estoque** por linha (D22), confirmação ao **pronto para entrega** (D23), busca por cliente ou carta (D17).
- ✅ UX: **filter bar** com Select em cartas/pedidos e **formulários de CRUD em Dialog** com overlay em desfoque em cartas, clientes e pedidos (ver D10).
- ✅ Ação **Visualizar** (detalhe somente leitura em Dialog + atalho **Editar**) em cartas, clientes e pedidos (ver D11).
- ✅ Módulo **`stock`** + **`/estoque`**: demanda para gráfica, filtro de falta gráfica, painel **pedidos com impressão pendente** via **`GET /order/print-backlog`** (D22); estoque ajustado **manualmente** (D28 revoga baixa automática ao entregar — D16).
- ✅ **`CardPrintModel`** + **`ProductionShipment`**; módulos **`card-print-model`** e **`production`**; páginas **`/modelos-carta`** e **`/producao`** — remessa manual, mover/remover linha (D17, D18); **envio à produção só por ação explícita** em Pedidos (D19); status de impressão só via remessa (D28).
- ✅ Menu lateral: grupo **operação** (Dashboard, Pedidos, Produção, Estoque), divisor, grupo **cadastros** (Clientes, Cartas, Modelos de cartas).
- ✅ Dashboard ampliado (D27): KPIs financeiros/operacionais, filtros período/TCG/UF, pipeline de arte, gráfico dual pedidos vs recebido, links para drill-down.
- ✅ Pedidos: select de modelo com opção **Modelo pendente** para limpar seleção (D29).
- ✅ Clientes: ação **Informações** com modal de histórico de compras (`GET /customer/:id/purchase-info`) — unidades, valores, breakdown por TCG, tabela paginada (D29).
- ✅ Brindes por cliente (`CustomerGift`): concessão/remoção em Clientes, badge/filtro na lista, toggle **Brinde** no formulário de Pedidos com consumo automático de saldo (D30).

### Próximos passos sugeridos (ordem natural)

1. **Evoluir catálogo comercial** a partir de `Card`: imagens, variações físicas, preço padrão sugerido ao montar pedidos.
2. **Importar dados das planilhas atuais** (script de migração único).
3. **Integrações** (pagamento, etiquetas, relatórios) conforme parking lot.

> Cada passo segue o padrão modular descrito em [`backend/AGENTS.md`](../backend/AGENTS.md). Antes de começar, alinhar campos/regras com o dono nesta seção.

### Parking lot (ideias sem prazo)

- Badges de cobertura de estoque nas linhas da lista/detalhe de pedidos (somente leitura).
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
3. Implementou uma feature? → atualize [Estado atual](#estado-atual-2026-05-19).
4. Novo termo de negócio entrou no código? → adicione em [Domínio](#dominio).

Manter este doc **honesto e atualizado** é mais importante do que torná-lo bonito.
