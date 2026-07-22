import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Banknote,
  Eye,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'

import { OrderCustomerCombobox } from '@/components/OrderCustomerCombobox'
import { OrderLineCardCombobox } from '@/components/OrderLineCardCombobox'
import { CardColorDots } from '@/components/CardColorDots'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ApiError from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { listCardsService } from '@/modules/card/services/list-cards.service'
import {
  CARD_TYPE_LABELS,
  TCG_LABELS,
  type TCard,
} from '@/modules/card/types/card.model'
import { listCustomersService } from '@/modules/customer/services/list-customers.service'
import type { TCustomer } from '@/modules/customer/types/customer.model'
import { listCardPrintModelsService } from '@/modules/card-print-model/services/list-card-print-models.service'
import type { TCardPrintModelRow } from '@/modules/card-print-model/types/card-print-model.model'
import { OrderDetailDialog } from '@/modules/order/components/order-detail-dialog'
import { OrderPaymentsDialog } from '@/modules/order/components/order-payments-dialog'
import type { PaymentSummaryPatch } from '@/modules/order/components/order-payments-section'
import { BRAZIL_UF_CODES, BRAZIL_UF_EXTENDED_LABELS } from '@/lib/brazil-regions'
import type { z } from 'zod'
import { BrazilUfZod } from '@/modules/customer/types/customer.model'
import {
  buildOrderSummaryClipboardText,
  formatOrderLineCardLabel,
  formatOrderSummaryDateShort,
} from '@/modules/order/lib/order-summary-text'
import { createOrderService } from '@/modules/order/services/create-order.service'
import { deleteOrderService } from '@/modules/order/services/delete-order.service'
import { getOrderService } from '@/modules/order/services/get-order.service'
import { listOrdersService } from '@/modules/order/services/list-orders.service'
import { patchOrderService } from '@/modules/order/services/patch-order.service'
import { sendOrderToProductionService } from '@/modules/order/services/send-order-to-production.service'
import { updateOrderService } from '@/modules/order/services/update-order.service'
import {
  DELIVERY_METHOD_LABELS,
  DELIVERY_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  effectiveMissingPrintModelCount,
  effectivePendingProductionCount,
  orderLinesWithoutModelCount,
  isOrderProductionEligible,
  computeLineTotal,
  computeOrderTotal,
  formatCurrency,
  deliveryMethodForOrderStatus,
  pipelineStatusesExcept,
  orderStatusCardAccent,
  orderStatusChipClass,
  showDeliveryField,
  type TDeliveryMethod,
  type TOrderBody,
  type TOrderPipelineStatus,
  type TOrderSummary,
} from '@/modules/order/types/order.model'

type OrdersListSortField = 'order_status' | 'total_amount' | 'item_count' | 'order_date'

type OrdersListSortBy = 'created_at' | OrdersListSortField

function OrdersSortHeader({
  label,
  field,
  activeField,
  dir,
  onSort,
}: {
  label: string
  field: OrdersListSortField
  activeField: OrdersListSortBy
  dir: 'asc' | 'desc'
  onSort: (f: OrdersListSortField) => void
}) {
  const active = activeField === field
  return (
    <th className="py-2 pr-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 gap-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        onClick={() => onSort(field)}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        aria-label={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        {active ? (
          dir === 'asc' ? (
            <ArrowUp className="size-3.5 shrink-0 text-foreground" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0 text-foreground" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </Button>
    </th>
  )
}

function OrderPaymentStatusChip({ order }: { order: TOrderSummary }) {
  if (order.is_fully_paid) {
    return (
      <span className="inline-flex w-fit rounded-md bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        100% recebido
      </span>
    )
  }
  if (order.amount_paid > 0) {
    return (
      <span className="inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Recebido {formatCurrency(order.amount_paid)} / {formatCurrency(order.total_amount)}
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground">—</span>
}

type LineForm = {
  card_id: number | null
  card_print_model_id: number | null
  fulfill_from_stock: boolean
  quantity: string
  unit_price: string
  art_status: 'art_to_do' | 'art_ready' | 'confirmed' | 'printing' | 'printed'
  print_model_summary: string | null
  production_shipment_id: number | null
  line_confirmed: boolean
}

type FormState = {
  customer_id: number | null
  order_date: string
  order_status: TOrderPipelineStatus
  delivery_method: TDeliveryMethod | null
  notes: string
  items: LineForm[]
}

const EMPTY_LINE: LineForm = {
  card_id: null,
  card_print_model_id: null,
  fulfill_from_stock: false,
  quantity: '1',
  unit_price: '',
  art_status: 'art_to_do',
  print_model_summary: null,
  production_shipment_id: null,
  line_confirmed: false,
}

function countFormPendingProduction(items: LineForm[]): number {
  return items.filter(
    (line) => line.production_shipment_id == null && !line.fulfill_from_stock,
  ).length
}

function countFormMissingPrintModel(items: LineForm[]): number {
  return items.filter(
    (line) =>
      line.production_shipment_id == null &&
      !line.fulfill_from_stock &&
      line.card_print_model_id == null,
  ).length
}

function printModelSummaryFromItem(
  model: { name: string; file_name: string } | null,
): string | null {
  if (!model) return null
  return `${model.name} (${model.file_name})`
}

function todayLocalIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Valor YYYY-MM-DD para `<input type="date" />` a partir da data comercial do pedido (backend usa meio-dia UTC). */
function orderDateToInputValue(value: Date): string {
  const d = value instanceof Date ? value : new Date(value)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyForm(): FormState {
  return {
    customer_id: null,
    order_status: 'quote',
    delivery_method: null,
    notes: '',
    order_date: todayLocalIsoDate(),
    items: [{ ...EMPTY_LINE }],
  }
}

type OrderStatusFilter = TOrderPipelineStatus | 'active_orders' | null
type CustomerStateFilter = z.infer<typeof BrazilUfZod> | null

function formatCardLabel(card: TCard): string {
  const tcg = TCG_LABELS[card.tcg]
  const type = CARD_TYPE_LABELS[card.card_type]
  const name = card.name?.trim()
  const edition = card.edition?.trim()
  const parts = [tcg, type]
  if (name) parts.push(name)
  if (edition) parts.push(`(${edition})`)
  return parts.join(' · ')
}

function getLineValidationMessage(line: LineForm, lineIndex: number): string | null {
  if (!line.card_id) {
    return `Selecione a carta da linha ${lineIndex + 1}.`
  }

  const quantity = Number(line.quantity)
  const unit_price = Number(line.unit_price.replace(',', '.'))

  if (!Number.isFinite(quantity) || quantity < 1) {
    return `Quantidade inválida na linha ${lineIndex + 1}.`
  }

  if (!Number.isFinite(unit_price) || unit_price < 0) {
    return `Preço inválido na linha ${lineIndex + 1}.`
  }

  return null
}

function buildBody(form: FormState): TOrderBody {
  if (!form.customer_id) {
    throw new Error('Selecione o cliente da encomenda.')
  }

  const items = form.items.map((line, index) => {
    if (!line.card_id) {
      throw new Error(`Selecione a carta da linha ${index + 1}.`)
    }

    const quantity = Number(line.quantity)
    const unit_price = Number(line.unit_price.replace(',', '.'))

    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error(`Quantidade inválida na linha ${index + 1}.`)
    }

    if (!Number.isFinite(unit_price) || unit_price < 0) {
      throw new Error(`Preço inválido na linha ${index + 1}.`)
    }

    return {
      card_id: line.card_id,
      quantity,
      unit_price,
      card_print_model_id: line.card_print_model_id,
      fulfill_from_stock: line.fulfill_from_stock,
    }
  })

  return {
    customer_id: form.customer_id,
    order_date: form.order_date,
    order_status: form.order_status,
    delivery_method: deliveryMethodForOrderStatus(form.order_status, form.delivery_method),
    notes: form.notes.trim() || null,
    items,
  }
}

export function PedidosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<TOrderSummary[]>([])
  const [customers, setCustomers] = useState<TCustomer[]>([])
  const [cards, setCards] = useState<TCard[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('active_orders')
  const [stateFilter, setStateFilter] = useState<CustomerStateFilter>(null)
  const [withBalanceOnly, setWithBalanceOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [paymentOrder, setPaymentOrder] = useState<TOrderSummary | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [patchingId, setPatchingId] = useState<number | null>(null)
  const [sendingToProductionId, setSendingToProductionId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(() => new Set())
  const [copiedSummaryId, setCopiedSummaryId] = useState<number | null>(null)
  const [statusMenuOrderId, setStatusMenuOrderId] = useState<number | null>(null)
  const [detailOrder, setDetailOrder] = useState<TOrderSummary | null>(null)
  const [readyDeliveryPrompt, setReadyDeliveryPrompt] = useState<{
    order: TOrderSummary
    nextStatus: TOrderPipelineStatus
  } | null>(null)

  const printModelsLoadedRef = useRef(new Set<number>())
  const [printModelsByCardId, setPrintModelsByCardId] = useState<Map<number, TCardPrintModelRow[]>>(
    () => new Map(),
  )

  const ensurePrintModelsForCard = useCallback(async (cardId: number) => {
    if (printModelsLoadedRef.current.has(cardId)) return
    printModelsLoadedRef.current.add(cardId)
    try {
      const data = await listCardPrintModelsService({ card_id: cardId, limit: 200 })
      setPrintModelsByCardId((prev) => {
        const next = new Map(prev)
        next.set(cardId, data.items)
        return next
      })
    } catch {
      printModelsLoadedRef.current.delete(cardId)
    }
  }, [])

  const [listSortBy, setListSortBy] = useState<OrdersListSortBy>('created_at')
  const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('desc')

  const refresh = useCallback(
    async (status: OrderStatusFilter, state: CustomerStateFilter, query: string) => {
      setLoading(true)
      setListError(null)
      try {
        const q = query.trim()
        const data = await listOrdersService({
          ...(status === 'active_orders'
            ? { exclude_order_status: 'delivered' }
            : status
              ? { order_status: status }
              : {}),
          ...(state ? { customer_state: state } : {}),
          ...(q ? { q } : {}),
          limit: 200,
          sort_by: listSortBy,
          sort: listSortDir,
        })
        setOrders(data.items)
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Não foi possível carregar os pedidos.'
        setListError(msg)
      } finally {
        setLoading(false)
      }
    },
    [listSortBy, listSortDir],
  )

  function handleOrdersSort(field: OrdersListSortField) {
    if (listSortBy === field) {
      setListSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setListSortBy(field)
      setListSortDir('desc')
    }
  }

  const loadLookups = useCallback(async () => {
    const [customersData, cardsData] = await Promise.all([
      listCustomersService({ limit: 500, sort_by: 'name', sort: 'asc' }),
      listCardsService({ limit: 500 }),
    ])
    setCustomers(customersData.items)
    setCards(cardsData.items)
  }, [])

  useEffect(() => {
    void refresh(statusFilter, stateFilter, search)
  }, [statusFilter, stateFilter, search, refresh])

  const openedFromQueryRef = useRef<number | null>(null)
  const urlFiltersAppliedRef = useRef(false)

  useEffect(() => {
    if (urlFiltersAppliedRef.current) return
    urlFiltersAppliedRef.current = true

    const status = searchParams.get('status')
    if (status === 'active_orders') {
      setStatusFilter('active_orders')
    } else if (status && (ORDER_STATUS_OPTIONS as readonly string[]).includes(status)) {
      setStatusFilter(status as TOrderPipelineStatus)
    }

    const uf = searchParams.get('uf')
    if (uf && (BRAZIL_UF_CODES as readonly string[]).includes(uf)) {
      setStateFilter(uf as CustomerStateFilter)
    }

    if (searchParams.get('with_balance') === '1') {
      setWithBalanceOnly(true)
    }
  }, [searchParams])

  const displayOrders = useMemo(() => {
    if (!withBalanceOnly) return orders
    return orders.filter(
      (order) =>
        order.amount_due > 0 &&
        order.order_status !== 'quote' &&
        order.order_status !== 'delivered',
    )
  }, [orders, withBalanceOnly])

  useEffect(() => {
    const raw = searchParams.get('orderId')
    if (!raw || loading) return
    const id = Number(raw)
    if (!Number.isFinite(id) || openedFromQueryRef.current === id) return
    const found = orders.find((o) => o.id === id)
    if (!found) return
    openedFromQueryRef.current = id
    setSearchParams({}, { replace: true })
    void openEdit(found)
  }, [loading, orders, searchParams, setSearchParams])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (!formOpen) return
    for (const line of form.items) {
      if (line.card_id != null) void ensurePrintModelsForCard(line.card_id)
    }
  }, [formOpen, form.items, ensurePrintModelsForCard])

  const formTotal = useMemo(() => {
    const parsed = form.items
      .map((line) => ({
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price.replace(',', '.')),
      }))
      .filter(
        (line) =>
          Number.isFinite(line.quantity) &&
          line.quantity > 0 &&
          Number.isFinite(line.unit_price) &&
          line.unit_price >= 0,
      )

    return computeOrderTotal(parsed)
  }, [form.items])

  const showDelivery = showDeliveryField(form.order_status)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  async function openEdit(order: TOrderSummary) {
    setFormError(null)
    try {
      const detail = await getOrderService(order.id)
      setEditingId(order.id)
      setForm({
        customer_id: detail.customer_id,
        order_date: orderDateToInputValue(detail.order_date),
        order_status: detail.order_status,
        delivery_method: detail.delivery_method,
        notes: detail.notes ?? '',
        items: detail.items.map((item) => ({
          card_id: item.card_id,
          card_print_model_id: item.card_print_model_id,
          fulfill_from_stock: item.fulfill_from_stock,
          quantity: String(item.quantity),
          unit_price: String(item.unit_price),
          art_status: item.art_status,
          print_model_summary: printModelSummaryFromItem(item.card_print_model),
          production_shipment_id: item.production_shipment_id,
          line_confirmed: true,
        })),
      })
      setFormOpen(true)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar o pedido.'
      setListError(msg)
    }
  }

  function patchOrderInList(orderId: number, patch: Partial<TOrderSummary>) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)))
    setDetailOrder((prev) => (prev?.id === orderId ? { ...prev, ...patch } : prev))
  }

  function openPayments(order: TOrderSummary) {
    setPaymentOrder(order)
  }

  function handlePaymentsUpdated(orderId: number, summary: PaymentSummaryPatch) {
    patchOrderInList(orderId, { ...summary })
    setPaymentOrder((prev) => (prev?.id === orderId ? { ...prev, ...summary } : prev))
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
  }

  async function handleOrderStatusChange(next: TOrderPipelineStatus) {
    if (next === form.order_status) return

    const previousStatus = form.order_status
    const previousDelivery = form.delivery_method
    const delivery_method = deliveryMethodForOrderStatus(next, form.delivery_method)

    setForm((prev) => ({
      ...prev,
      order_status: next,
      delivery_method,
    }))
    setFormError(null)

    if (editingId == null) return

    setPatchingId(editingId)
    try {
      const payload: Parameters<typeof patchOrderService>[1] = { order_status: next }
      if (next === 'delivered') {
        payload.delivery_method = delivery_method
      }
      await patchOrderService(editingId, payload)
      await refresh(statusFilter, stateFilter, search)
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        order_status: previousStatus,
        delivery_method: previousDelivery,
      }))
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível atualizar o status.'
      setFormError(msg)
    } finally {
      setPatchingId(null)
    }
  }

  function updateLine(index: number, patch: Partial<LineForm>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    }))
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_LINE }],
    }))
  }

  function removeLine(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    const pendingIdx = form.items.findIndex((line) => !line.line_confirmed)
    if (pendingIdx !== -1) {
      setFormError(
        `Confirme todas as linhas antes de salvar (linha ${pendingIdx + 1} ainda em edição — use «Confirmar linha» em cada carta).`,
      )
      return
    }

    try {
      const body = buildBody(form)
      setSubmitting(true)
      if (editingId == null) {
        await createOrderService(body)
      } else {
        await updateOrderService(editingId, body)
      }
      closeForm()
      await refresh(statusFilter, stateFilter, search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível salvar o pedido.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(order: TOrderSummary) {
    const confirmed = window.confirm(
      `Remover o pedido de "${order.customer_name}"? Essa ação pode ser revertida via banco (soft delete).`,
    )
    if (!confirmed) return

    setDeletingId(order.id)
    try {
      await deleteOrderService(order.id)
      await refresh(statusFilter, stateFilter, search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível remover o pedido.'
      setListError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  async function applyPipelineStatusPatch(
    order: TOrderSummary,
    next_status: TOrderPipelineStatus,
  ) {
    setPatchingId(order.id)
    setStatusMenuOrderId(null)
    try {
      const payload: Parameters<typeof patchOrderService>[1] = { order_status: next_status }
      if (next_status === 'delivered') {
        payload.delivery_method = deliveryMethodForOrderStatus(
          next_status,
          order.delivery_method,
        )
      }
      await patchOrderService(order.id, payload)
      await refresh(statusFilter, stateFilter, search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível atualizar o status.'
      setListError(msg)
    } finally {
      setPatchingId(null)
    }
  }

  async function handlePipelineStatusChange(
    order: TOrderSummary,
    next_status: TOrderPipelineStatus,
  ) {
    if (next_status === 'ready_for_delivery') {
      const pending = effectivePendingProductionCount(order)
      const missing = effectiveMissingPrintModelCount(order)
      if (pending > 0 || missing > 0) {
        setReadyDeliveryPrompt({ order, nextStatus: next_status })
        setStatusMenuOrderId(null)
        return
      }
    }
    await applyPipelineStatusPatch(order, next_status)
  }

  async function handleReadyDeliverySendAndAdvance() {
    if (!readyDeliveryPrompt) return
    const { order, nextStatus } = readyDeliveryPrompt
    if (effectiveMissingPrintModelCount(order) > 0) return

    setReadyDeliveryPrompt(null)
    setSendingToProductionId(order.id)
    try {
      if (effectivePendingProductionCount(order) > 0) {
        await sendOrderToProductionService(order.id)
      }
      await applyPipelineStatusPatch(order, nextStatus)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível enviar à produção ou atualizar o status.'
      setListError(msg)
    } finally {
      setSendingToProductionId(null)
    }
  }

  async function handleSendToProduction(order: TOrderSummary) {
    const pending = effectivePendingProductionCount(order)
    if (pending === 0) return
    if (effectiveMissingPrintModelCount(order) > 0) {
      setListError(
        'Defina o modelo de impressão em todas as linhas pendentes antes de enviar à produção.',
      )
      return
    }

    const confirmed = window.confirm(
      `Enviar ${pending} linha(s) pendente(s) de "${order.customer_name}" para a remessa em aguardando impressão?`,
    )
    if (!confirmed) return

    setSendingToProductionId(order.id)
    setListError(null)
    try {
      await sendOrderToProductionService(order.id)
      await refresh(statusFilter, stateFilter, search)
      if (detailOrder?.id === order.id) {
        setDetailOrder(null)
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível enviar o pedido para a produção.'
      setListError(msg)
    } finally {
      setSendingToProductionId(null)
    }
  }

  async function handleSendToProductionFromForm() {
    if (editingId == null || !isOrderProductionEligible(form.order_status)) return
    const pending = countFormPendingProduction(form.items)
    if (pending === 0) return
    const missing = countFormMissingPrintModel(form.items)
    if (missing > 0) {
      setFormError(
        `Defina o modelo de impressão em ${missing} linha(s) pendente(s) antes de enviar à produção.`,
      )
      return
    }

    const confirmed = window.confirm(
      `Enviar ${pending} linha(s) pendente(s) para a remessa em aguardando impressão? Salve o pedido antes se ainda houver alterações não gravadas.`,
    )
    if (!confirmed) return

    setSendingToProductionId(editingId)
    setFormError(null)
    try {
      await sendOrderToProductionService(editingId)
      const detail = await getOrderService(editingId)
      setForm((prev) => ({
        ...prev,
        items: detail.items.map((item) => ({
          card_id: item.card_id,
          card_print_model_id: item.card_print_model_id,
          fulfill_from_stock: item.fulfill_from_stock,
          quantity: String(item.quantity),
          unit_price: String(item.unit_price),
          art_status: item.art_status,
          print_model_summary: printModelSummaryFromItem(item.card_print_model),
          production_shipment_id: item.production_shipment_id,
          line_confirmed: true,
        })),
      }))
      await refresh(statusFilter, stateFilter, search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível enviar o pedido para a produção.'
      setFormError(msg)
    } finally {
      setSendingToProductionId(null)
    }
  }

  function toggleOrderExpanded(orderId: number) {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  async function handleCopyOrderSummary(order: TOrderSummary) {
    const text = buildOrderSummaryClipboardText(order)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSummaryId(order.id)
      window.setTimeout(() => {
        setCopiedSummaryId((current) => (current === order.id ? null : current))
      }, 2000)
    } catch {
      window.prompt('Copie o texto:', text)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Organize encomendas por cliente, cartas, valores e status. Busque pedidos
          pelo nome do cliente na barra acima.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:gap-4">
          <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-[200px] sm:max-w-md">
            <Label
              htmlFor="order-search"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Buscar
            </Label>
            <Input
              id="order-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente ou nome da carta"
              aria-label="Buscar pedidos por cliente ou nome ou edição da carta"
            />
          </div>
          <div className="grid min-w-[220px] flex-1 gap-1.5">
            <Label
              htmlFor="filter-order-status"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Status
            </Label>
            <Select
              value={statusFilter === null ? 'all' : statusFilter}
              onValueChange={(v) => {
                if (v === 'all') setStatusFilter(null)
                else if (v === 'active_orders') setStatusFilter('active_orders')
                else setStatusFilter(v as TOrderPipelineStatus)
              }}
            >
              <SelectTrigger id="filter-order-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active_orders">Pedidos Ativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-[200px] flex-1 gap-1.5 sm:max-w-[240px]">
            <Label
              htmlFor="filter-customer-state"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              UF do cliente
            </Label>
            <Select
              value={stateFilter ?? 'all'}
              onValueChange={(v) =>
                setStateFilter(v === 'all' ? null : (v as CustomerStateFilter))
              }
            >
              <SelectTrigger id="filter-customer-state">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {BRAZIL_UF_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code} — {BRAZIL_UF_EXTENDED_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-[180px] flex-1 gap-1.5 sm:max-w-[220px]">
            <Label
              htmlFor="filter-view"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Visualização
            </Label>
            <Select
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'table' | 'cards')}
            >
              <SelectTrigger id="filter-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">
                  <span className="flex items-center gap-2">
                    <ListIcon className="size-3.5" aria-hidden />
                    Lista
                  </span>
                </SelectItem>
                <SelectItem value="cards">
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="size-3.5" aria-hidden />
                    Painel
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {!formOpen ? (
          <Button type="button" size="sm" className="shrink-0" onClick={openCreate}>
            <Plus className="size-3.5" />
            Novo pedido
          </Button>
        ) : null}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
      >
        <DialogContent className="max-h-[min(92dvh,56rem)] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId == null ? 'Novo pedido' : 'Editar pedido'}</DialogTitle>
            <DialogDescription>
              Enquanto o pedido estiver em orçamento, os status de arte das linhas ficam bloqueados.
            </DialogDescription>
          </DialogHeader>
          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
              {formError ? (
                <p
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}

              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="order-customer">Cliente</Label>
                  <Link
                    to="/clientes"
                    className="text-xs text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Novo cliente
                  </Link>
                </div>
                <OrderCustomerCombobox
                  id="order-customer"
                  customers={customers}
                  customerId={form.customer_id}
                  onCustomerChange={(next) =>
                    setForm((prev) => ({ ...prev, customer_id: next }))
                  }
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order-order-date">Data do pedido</Label>
                <Input
                  id="order-order-date"
                  type="date"
                  value={form.order_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, order_date: e.target.value }))
                  }
                  disabled={submitting}
                  max="2099-12-31"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order-pipeline-status">Status do pedido</Label>
                <Select
                  value={form.order_status}
                  onValueChange={(v) => void handleOrderStatusChange(v as TOrderPipelineStatus)}
                  disabled={submitting || (editingId != null && patchingId === editingId)}
                >
                  <SelectTrigger id="order-pipeline-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showDelivery ? (
                <div className="grid gap-2">
                  <Label>Forma de envio</Label>
                  <div className="flex flex-wrap gap-2">
                    {DELIVERY_OPTIONS.map((method) => (
                      <Button
                        key={method}
                        type="button"
                        size="sm"
                        variant={form.delivery_method === method ? 'default' : 'outline'}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, delivery_method: method }))
                        }
                      >
                        {DELIVERY_METHOD_LABELS[method]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="order-notes">Observações</Label>
                <Input
                  id="order-notes"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-1">
                    <Label>Cartas do pedido</Label>
                    <p className="text-xs text-muted-foreground">
                      Confirme cada linha para um resumo compacto antes de cadastrar.
                      {isOrderProductionEligible(form.order_status) ? (
                        <>
                          {' '}
                          Use <strong>Enviar para produção</strong> quando as cartas precisarem ir à gráfica (não é automático ao
                          salvar).
                        </>
                      ) : (
                        <>
                          {' '}
                          Pedidos em aguardando pagamento, prontos para entrega ou entregues não usam a fila da gráfica — o
                          estoque cobre a liberação quando aplicável.
                        </>
                      )}{' '}
                      A busca fica dentro do seletor de cada carta.
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addLine} className="shrink-0">
                    <Plus className="size-3.5" />
                    Adicionar carta
                  </Button>
                </div>

                {form.items.map((line, index) => {
                  const quantity = Number(line.quantity)
                  const unitPrice = Number(line.unit_price.replace(',', '.'))
                  const lineTotal =
                    Number.isFinite(quantity) && Number.isFinite(unitPrice)
                      ? computeLineTotal(quantity, unitPrice)
                      : 0

                  const lineCard =
                    line.card_id != null ? cards.find((c) => c.id === line.card_id) : undefined

                  if (line.line_confirmed) {
                    const displayName =
                      line.card_id != null && lineCard
                        ? formatCardLabel(lineCard)
                        : line.card_id != null
                          ? `Carta #${line.card_id} (catálogo indisponível)`
                          : 'Carta não selecionada'

                    return (
                      <div
                        key={`line-${index}`}
                        className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            <span className="pt-0.5">
                              <CardColorDots colors={lineCard?.colors ?? []} className="shrink-0" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Linha {index + 1}</p>
                              <p className="truncate font-medium leading-snug">{displayName}</p>
                              {line.fulfill_from_stock ? (
                                <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90">
                                  Atender do estoque
                                </p>
                              ) : null}
                              {line.print_model_summary ? (
                                <p className="text-xs text-muted-foreground">
                                  Modelo: {line.print_model_summary}
                                </p>
                              ) : !line.fulfill_from_stock ? (
                                <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
                                  Modelo: pendente
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-sm">
                            <p className="text-muted-foreground">
                              Qtd. {line.quantity}
                            </p>
                            <p className="font-semibold tabular-nums">{formatCurrency(lineTotal)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setFormError(null)
                              updateLine(index, { line_confirmed: false })
                            }}
                            disabled={submitting}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeLine(index)}
                            disabled={form.items.length === 1 || submitting}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={`line-${index}`}
                      className="rounded-lg border border-border/60 bg-muted/20 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Linha {index + 1}</p>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => removeLine(index)}
                          disabled={form.items.length === 1 || submitting}
                          aria-label="Remover linha"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor={`order-line-card-${index}`}>Carta</Label>
                        <OrderLineCardCombobox
                          id={`order-line-card-${index}`}
                          cards={cards}
                          cardId={line.card_id}
                          onCardChange={(next) => {
                            updateLine(index, {
                              card_id: next,
                              card_print_model_id: null,
                              print_model_summary: null,
                              line_confirmed: false,
                            })
                            if (next != null) void ensurePrintModelsForCard(next)
                          }}
                          disabled={submitting}
                          formatCardLabel={formatCardLabel}
                        />

                        {line.card_id != null ? (
                          <div className="grid gap-2">
                            <Label>Modelo de impressão</Label>
                            <Select
                              value={
                                line.card_print_model_id != null
                                  ? String(line.card_print_model_id)
                                  : 'none'
                              }
                              onValueChange={(v) => {
                                const id = v === 'none' ? null : Number(v)
                                const list =
                                  printModelsByCardId.get(line.card_id!) ?? []
                                const row =
                                  id != null ? list.find((m) => m.id === id) : undefined
                                updateLine(index, {
                                  card_print_model_id: id,
                                  print_model_summary:
                                    row != null
                                      ? `${row.name} (${row.file_name})`
                                      : null,
                                  line_confirmed: false,
                                })
                              }}
                              disabled={submitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Opcional — definir antes da produção" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Modelo pendente</SelectItem>
                                {(printModelsByCardId.get(line.card_id) ?? []).map((m) => (
                                  <SelectItem key={m.id} value={String(m.id)}>
                                    {m.name} ({m.file_name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

                        <label className="flex cursor-pointer items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4 rounded border-border"
                            checked={line.fulfill_from_stock}
                            disabled={submitting}
                            onChange={(e) =>
                              updateLine(index, {
                                fulfill_from_stock: e.target.checked,
                                line_confirmed: false,
                              })
                            }
                          />
                          <span>
                            <span className="font-medium">Atender do estoque</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              Não entra na fila da gráfica nem no envio à produção.
                            </span>
                          </span>
                        </label>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="grid gap-2">
                            <Label>Quantidade</Label>
                            <Input
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(index, {
                                  quantity: e.target.value,
                                  line_confirmed: false,
                                })
                              }
                              inputMode="numeric"
                              required
                              disabled={submitting}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Preço unitário</Label>
                            <Input
                              value={line.unit_price}
                              onChange={(e) =>
                                updateLine(index, {
                                  unit_price: e.target.value,
                                  line_confirmed: false,
                                })
                              }
                              inputMode="decimal"
                              required
                              disabled={submitting}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Subtotal</Label>
                            <div className="flex h-9 items-center rounded-md border border-border px-3 text-sm">
                              {formatCurrency(lineTotal)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const msg = getLineValidationMessage(line, index)
                              if (msg) {
                                setFormError(msg)
                                return
                              }
                              setFormError(null)
                              updateLine(index, { line_confirmed: true })
                            }}
                            disabled={submitting}
                          >
                            Confirmar linha
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total do pedido</span>
                <span className="text-lg font-semibold">{formatCurrency(formTotal)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Salvando…
                    </>
                  ) : editingId == null ? (
                    'Cadastrar pedido'
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                  Cancelar
                </Button>
                {editingId != null &&
                isOrderProductionEligible(form.order_status) &&
                countFormPendingProduction(form.items) > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-1"
                    disabled={
                      submitting ||
                      sendingToProductionId === editingId ||
                      countFormMissingPrintModel(form.items) > 0
                    }
                    title={
                      countFormMissingPrintModel(form.items) > 0
                        ? 'Defina o modelo de impressão nas linhas pendentes'
                        : undefined
                    }
                    onClick={() => void handleSendToProductionFromForm()}
                  >
                    {sendingToProductionId === editingId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    Enviar para produção
                  </Button>
                ) : null}
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Encomendas</CardTitle>
          <CardDescription>
            {loading
              ? 'Carregando pedidos…'
              : withBalanceOnly
                ? `${displayOrders.length} pedido${displayOrders.length === 1 ? '' : 's'} com saldo em aberto.`
                : `${displayOrders.length} pedido${displayOrders.length === 1 ? '' : 's'} listado${displayOrders.length === 1 ? '' : 's'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listError ? (
            <p
              className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {listError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando…
            </div>
          ) : displayOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum pedido cadastrado ainda.
            </p>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Cliente</th>
                    <OrdersSortHeader
                      label="Status"
                      field="order_status"
                      activeField={listSortBy}
                      dir={listSortDir}
                      onSort={handleOrdersSort}
                    />
                    <OrdersSortHeader
                      label="Total"
                      field="total_amount"
                      activeField={listSortBy}
                      dir={listSortDir}
                      onSort={handleOrdersSort}
                    />
                    <OrdersSortHeader
                      label="Itens"
                      field="item_count"
                      activeField={listSortBy}
                      dir={listSortDir}
                      onSort={handleOrdersSort}
                    />
                    <OrdersSortHeader
                      label="Data do pedido"
                      field="order_date"
                      activeField={listSortBy}
                      dir={listSortDir}
                      onSort={handleOrdersSort}
                    />
                    <th className="py-2 pr-3 font-medium">Status de pagamento</th>
                    <th className="py-2 pl-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((order) => {
                    const statusOptions = pipelineStatusesExcept(order.order_status)
                    return (
                    <tr key={order.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-3 font-medium">
                        <span className="flex flex-col gap-1">
                          <span>
                            {order.customer_name}
                            {order.customer_state ? (
                              <span className="ml-1 text-xs font-normal text-muted-foreground">
                                ({order.customer_state})
                              </span>
                            ) : null}
                          </span>
                          {effectivePendingProductionCount(order) > 0 ||
                          orderLinesWithoutModelCount(order) > 0 ? (
                            <span className="flex flex-wrap gap-1">
                              {effectivePendingProductionCount(order) > 0 ? (
                                <span className="w-fit rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-normal text-amber-200/90">
                                  {effectivePendingProductionCount(order)} fora da produção
                                </span>
                              ) : null}
                              {orderLinesWithoutModelCount(order) > 0 ? (
                                <span className="w-fit rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-normal text-sky-200/90">
                                  {orderLinesWithoutModelCount(order)} sem modelo
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={cn(
                            'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            orderStatusChipClass(order.order_status),
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.order_status]}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium">{formatCurrency(order.total_amount)}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{order.item_count}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatOrderSummaryDateShort(order.order_date)}
                      </td>
                      <td className="py-2 pr-3">
                        <OrderPaymentStatusChip order={order} />
                      </td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <Popover
                            open={statusMenuOrderId === order.id}
                            onOpenChange={(open) =>
                              setStatusMenuOrderId(open ? order.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                disabled={patchingId === order.id}
                                aria-label="Alterar status do pedido"
                              >
                                <ArrowRightLeft className="size-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-1" align="end">
                              <p className="px-2 pb-1 text-xs text-muted-foreground">
                                Alterar status
                              </p>
                              <p className="px-2 pb-2 text-xs font-medium">
                                Atual: {ORDER_STATUS_LABELS[order.order_status]}
                              </p>
                              <div className="flex flex-col gap-0.5">
                                {statusOptions.map((s) => (
                                  <Button
                                    key={s}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start px-2 text-sm"
                                    disabled={patchingId === order.id}
                                    onClick={() =>
                                      void handlePipelineStatusChange(order, s)
                                    }
                                  >
                                    {ORDER_STATUS_LABELS[s]}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          {effectivePendingProductionCount(order) > 0 ? (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              disabled={
                                sendingToProductionId === order.id ||
                                effectiveMissingPrintModelCount(order) > 0
                              }
                              onClick={() => void handleSendToProduction(order)}
                              aria-label="Enviar para produção"
                              title={
                                effectiveMissingPrintModelCount(order) > 0
                                  ? 'Defina o modelo de impressão nas linhas pendentes'
                                  : 'Enviar para produção'
                              }
                            >
                              {sendingToProductionId === order.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Send className="size-3.5" />
                              )}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openPayments(order)}
                            aria-label="Registrar pagamento"
                            title="Pagamentos"
                          >
                            <Banknote className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDetailOrder(order)}
                            aria-label="Visualizar pedido"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(order)}
                            aria-label="Editar pedido"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete(order)}
                            disabled={deletingId === order.id}
                            aria-label="Remover pedido"
                            className="hover:text-destructive"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayOrders.map((order) => {
                const expanded = expandedOrderIds.has(order.id)
                const statusOptions = pipelineStatusesExcept(order.order_status)
                return (
                  <article
                    key={order.id}
                    className={cn(
                      'flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm',
                      orderStatusCardAccent(order.order_status),
                    )}
                  >
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold leading-tight">
                          {order.customer_name}
                          {order.customer_state ? (
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                              ({order.customer_state})
                            </span>
                          ) : null}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 gap-1 text-muted-foreground"
                          aria-expanded={expanded}
                          onClick={() => toggleOrderExpanded(order.id)}
                        >
                          {expanded ? (
                            <ChevronUp className="size-4" aria-hidden />
                          ) : (
                            <ChevronDown className="size-4" aria-hidden />
                          )}
                          {expanded ? 'Recolher' : 'Expandir'}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 font-medium',
                            orderStatusChipClass(order.order_status),
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.order_status]}
                        </span>
                        {showDeliveryField(order.order_status) && order.delivery_method ? (
                          <span>{DELIVERY_METHOD_LABELS[order.delivery_method]}</span>
                        ) : null}
                        <span className="font-medium text-foreground">
                          Total {formatCurrency(order.total_amount)}
                        </span>
                        {order.is_fully_paid ? (
                          <span className="rounded-md bg-emerald-600/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                            100% recebido
                          </span>
                        ) : order.amount_paid > 0 ? (
                          <span className="text-muted-foreground">
                            Recebido {formatCurrency(order.amount_paid)}
                          </span>
                        ) : null}
                        <span>Pedido {formatOrderSummaryDateShort(order.order_date)}</span>
                        <span>Criado {formatOrderSummaryDateShort(order.created_at)}</span>
                        <span>Atual. {formatOrderSummaryDateShort(order.updated_at ?? order.created_at)}</span>
                        {effectivePendingProductionCount(order) > 0 ? (
                          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-200/90">
                            {effectivePendingProductionCount(order)} fora da produção
                          </span>
                        ) : null}
                        {orderLinesWithoutModelCount(order) > 0 ? (
                          <span className="rounded-md bg-sky-500/15 px-2 py-0.5 font-medium text-sky-200/90">
                            {orderLinesWithoutModelCount(order)} sem modelo
                          </span>
                        ) : null}
                      </div>

                      <div
                        className={cn(
                          'space-y-2 overflow-y-auto pr-1 text-sm',
                          expanded ? 'max-h-[70vh]' : 'max-h-40',
                        )}
                      >
                        {order.lines.map((line) => (
                          <div
                            key={line.id}
                            className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-border/50 bg-muted/15 px-2 py-1.5"
                          >
                            <CardColorDots colors={line.card.colors} />
                            <span className="min-w-0 flex-1 font-medium leading-snug">
                              {formatOrderLineCardLabel(line.card)}
                            </span>
                            <span className="w-full text-[11px] text-muted-foreground sm:w-auto sm:text-right">
                              {line.fulfill_from_stock
                                ? 'Estoque'
                                : line.card_print_model
                                  ? `${line.card_print_model.name} · ${line.card_print_model.file_name}`
                                  : 'Modelo pendente'}
                            </span>
                            <span className="text-muted-foreground">
                              {line.quantity} × {formatCurrency(line.unit_price)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(line.line_total)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {expanded && order.notes?.trim() ? (
                        <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                          <span className="font-medium text-foreground">Observações — </span>
                          {order.notes.trim()}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => void handleCopyOrderSummary(order)}
                        >
                          <Copy className="size-3.5" aria-hidden />
                          {copiedSummaryId === order.id ? 'Copiado' : 'Copiar resumo'}
                        </Button>
                        <Popover
                          open={statusMenuOrderId === order.id}
                          onOpenChange={(open) =>
                            setStatusMenuOrderId(open ? order.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={patchingId === order.id}
                            >
                              <ArrowRightLeft className="size-3.5" aria-hidden />
                              Alterar status
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-1" align="start">
                            <p className="px-2 pb-1 text-xs text-muted-foreground">
                              Alterar status
                            </p>
                            <p className="px-2 pb-2 text-xs font-medium">
                              Atual: {ORDER_STATUS_LABELS[order.order_status]}
                            </p>
                            <div className="flex flex-col gap-0.5">
                              {statusOptions.map((s) => (
                                <Button
                                  key={s}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 justify-start px-2 text-sm"
                                  disabled={patchingId === order.id}
                                  onClick={() =>
                                    void handlePipelineStatusChange(order, s)
                                  }
                                >
                                  {ORDER_STATUS_LABELS[s]}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex gap-1 sm:ml-auto">
                          {effectivePendingProductionCount(order) > 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="gap-1"
                              disabled={
                                sendingToProductionId === order.id ||
                                effectiveMissingPrintModelCount(order) > 0
                              }
                              title={
                                effectiveMissingPrintModelCount(order) > 0
                                  ? 'Defina o modelo de impressão nas linhas pendentes'
                                  : undefined
                              }
                              onClick={() => void handleSendToProduction(order)}
                            >
                              {sendingToProductionId === order.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Send className="size-3.5" />
                              )}
                              Produção
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openPayments(order)}
                            aria-label="Registrar pagamento"
                            title="Pagamentos"
                          >
                            <Banknote className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDetailOrder(order)}
                            aria-label="Visualizar pedido"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(order)}
                            aria-label="Editar pedido"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete(order)}
                            disabled={deletingId === order.id}
                            aria-label="Remover pedido"
                            className="hover:text-destructive"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={readyDeliveryPrompt != null}
        onOpenChange={(open) => {
          if (!open) setReadyDeliveryPrompt(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pronto para a entrega</DialogTitle>
            <DialogDescription>
              {readyDeliveryPrompt ? (
                <>
                  O pedido de <strong>{readyDeliveryPrompt.order.customer_name}</strong> ainda
                  tem{' '}
                  {effectivePendingProductionCount(readyDeliveryPrompt.order) > 0 ? (
                    <span>
                      {effectivePendingProductionCount(readyDeliveryPrompt.order)} linha(s) fora
                      da produção
                    </span>
                  ) : null}
                  {effectivePendingProductionCount(readyDeliveryPrompt.order) > 0 &&
                  effectiveMissingPrintModelCount(readyDeliveryPrompt.order) > 0
                    ? ' e '
                    : null}
                  {effectiveMissingPrintModelCount(readyDeliveryPrompt.order) > 0 ? (
                    <span>
                      {effectiveMissingPrintModelCount(readyDeliveryPrompt.order)} linha(s) sem
                      modelo de impressão
                    </span>
                  ) : null}
                  . Deseja avançar o status mesmo assim?
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReadyDeliveryPrompt(null)}
            >
              Cancelar
            </Button>
            {readyDeliveryPrompt &&
            isOrderProductionEligible(readyDeliveryPrompt.order.order_status) &&
            effectivePendingProductionCount(readyDeliveryPrompt.order) > 0 &&
            effectiveMissingPrintModelCount(readyDeliveryPrompt.order) === 0 ? (
              <Button
                type="button"
                variant="secondary"
                disabled={sendingToProductionId === readyDeliveryPrompt.order.id}
                onClick={() => void handleReadyDeliverySendAndAdvance()}
              >
                Enviar à produção e avançar
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={patchingId === readyDeliveryPrompt?.order.id}
              onClick={() => {
                if (!readyDeliveryPrompt) return
                const { order, nextStatus } = readyDeliveryPrompt
                setReadyDeliveryPrompt(null)
                void applyPipelineStatusPatch(order, nextStatus)
              }}
            >
              Avançar mesmo assim
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OrderPaymentsDialog
        open={paymentOrder != null}
        order={paymentOrder}
        onOpenChange={(open) => {
          if (!open) setPaymentOrder(null)
        }}
        onPaymentsUpdated={handlePaymentsUpdated}
      />

      <OrderDetailDialog
        open={detailOrder != null}
        order={detailOrder}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null)
        }}
        onEdit={(o) => void openEdit(o)}
        onRegisterPayment={openPayments}
        onSendToProduction={(o) => void handleSendToProduction(o)}
        sendingToProduction={
          detailOrder != null && sendingToProductionId === detailOrder.id
        }
      />
    </div>
  )
}
