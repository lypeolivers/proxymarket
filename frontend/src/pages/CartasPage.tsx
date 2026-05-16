import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ApiError from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { CardDetailDialog } from '@/modules/card/components/card-detail-dialog'
import {
  CARD_COLOR_HEX,
  CARD_COLOR_LABELS,
  CARD_TYPE_LABELS,
  CARD_TYPES_BY_TCG,
  CardColor,
  STATUS_LABELS,
  TCG_LABELS,
  type TCard,
  type TCardBody,
  type TCardColor,
  type TCardType,
  type TTcg,
} from '@/modules/card/types/card.model'
import { createCardService } from '@/modules/card/services/create-card.service'
import { deleteCardService } from '@/modules/card/services/delete-card.service'
import { listCardsService } from '@/modules/card/services/list-cards.service'
import { updateCardService } from '@/modules/card/services/update-card.service'

type FormState = {
  tcg: TTcg | null
  card_type: TCardType | null
  name: string
  edition: string
  colors: TCardColor[]
}

const EMPTY_FORM: FormState = {
  tcg: null,
  card_type: null,
  name: '',
  edition: '',
  colors: [],
}

const TCG_OPTIONS: TTcg[] = ['one_piece', 'magic', 'pokemon']
const COLOR_OPTIONS: TCardColor[] = CardColor.options

function formatDate(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(value)
}

function cardToForm(card: TCard): FormState {
  return {
    tcg: card.tcg,
    card_type: card.card_type,
    name: card.name ?? '',
    edition: card.edition ?? '',
    colors: card.colors,
  }
}

function buildBody(form: FormState): TCardBody {
  if (!form.tcg || !form.card_type) {
    throw new Error('Selecione o TCG e o tipo da carta.')
  }

  if (form.tcg === 'one_piece') {
    if (form.card_type === 'leader') {
      return {
        tcg: 'one_piece',
        card_type: 'leader',
        name: form.name.trim(),
        edition: form.edition.trim(),
        colors: form.colors,
      }
    }
    return { tcg: 'one_piece', card_type: 'don' }
  }

  if (form.tcg === 'magic') {
    if (form.card_type !== 'token' && form.card_type !== 'commander') {
      throw new Error('Tipo inválido para Magic.')
    }
    return {
      tcg: 'magic',
      card_type: form.card_type,
      name: form.name.trim(),
    }
  }

  if (
    form.card_type === 'pokemon' ||
    form.card_type === 'supporter' ||
    form.card_type === 'item' ||
    form.card_type === 'stadium' ||
    form.card_type === 'tool'
  ) {
    return {
      tcg: 'pokemon',
      card_type: form.card_type,
      name: form.name.trim(),
    }
  }

  throw new Error('Tipo inválido para Pokémon.')
}

export function CartasPage() {
  const [cards, setCards] = useState<TCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TTcg | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [detailCard, setDetailCard] = useState<TCard | null>(null)

  const refresh = useCallback(async (tcg: TTcg | null, query: string) => {
    setLoading(true)
    setListError(null)
    try {
      const q = query.trim()
      const data = await listCardsService({
        ...(tcg ? { tcg } : {}),
        ...(q ? { q } : {}),
        limit: 500,
      })
      setCards(data.items)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar as cartas.'
      setListError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(filter, search)
  }, [filter, search, refresh])

  const typeOptions = useMemo<TCardType[]>(() => {
    if (!form.tcg) return []
    return CARD_TYPES_BY_TCG[form.tcg]
  }, [form.tcg])

  const showNameField =
    form.tcg !== null &&
    form.card_type !== null &&
    !(form.tcg === 'one_piece' && form.card_type === 'don')

  const showEditionField =
    form.tcg === 'one_piece' && form.card_type === 'leader'

  const showColorsField =
    form.tcg === 'one_piece' && form.card_type === 'leader'

  const showEmptyNotice =
    form.tcg === 'one_piece' && form.card_type === 'don'

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(card: TCard) {
    setEditingId(card.id)
    setForm(cardToForm(card))
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function handleTcgChange(next: TTcg) {
    setForm({ ...EMPTY_FORM, tcg: next })
    setFormError(null)
  }

  function handleTypeChange(next: TCardType) {
    setForm((prev) => ({
      ...prev,
      card_type: next,
      name: next === 'don' ? '' : prev.name,
      edition: next === 'leader' ? prev.edition : '',
      colors: next === 'leader' ? prev.colors : [],
    }))
    setFormError(null)
  }

  function toggleColor(color: TCardColor) {
    setForm((prev) => {
      const has = prev.colors.includes(color)
      if (has) {
        return { ...prev, colors: prev.colors.filter((c) => c !== color) }
      }
      if (prev.colors.length >= 2) {
        return { ...prev, colors: [prev.colors[1], color] }
      }
      return { ...prev, colors: [...prev.colors, color] }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    try {
      const body = buildBody(form)
      setSubmitting(true)
      if (editingId == null) {
        await createCardService(body)
      } else {
        await updateCardService(editingId, body)
      }
      closeForm()
      await refresh(filter, search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível salvar a carta.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(card: TCard) {
    const label = card.name?.trim() || CARD_TYPE_LABELS[card.card_type]
    const confirmed = window.confirm(
      `Remover a carta "${label}"? Essa ação pode ser revertida via banco (soft delete).`,
    )
    if (!confirmed) return

    setDeletingId(card.id)
    try {
      await deleteCardService(card.id)
      await refresh(filter, search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível remover a carta.'
      setListError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cartas</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo das proxys que você produz. Busque pelo nome ou edição, filtre
          por TCG e use <strong>Nova carta</strong> para cadastrar.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:gap-4">
          <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-[200px] sm:max-w-md">
            <Label
              htmlFor="cart-search"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Buscar
            </Label>
            <Input
              id="cart-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou edição da carta"
              aria-label="Buscar cartas por nome ou edição"
            />
          </div>
          <div className="grid min-w-0 gap-1.5 sm:max-w-xs sm:flex-1">
            <Label
              htmlFor="filter-tcg"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              TCG
            </Label>
            <Select
              value={filter ?? 'all'}
              onValueChange={(v) => setFilter(v === 'all' ? null : (v as TTcg))}
            >
              <SelectTrigger id="filter-tcg" className="w-full sm:min-w-[220px]">
                <SelectValue placeholder="Filtrar por TCG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TCG_OPTIONS.map((tcg) => (
                  <SelectItem key={tcg} value={tcg}>
                    {TCG_LABELS[tcg]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {!formOpen ? (
          <Button type="button" size="sm" className="shrink-0" onClick={openCreate}>
            <Plus className="size-3.5" />
            Nova carta
          </Button>
        ) : null}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
      >
        <DialogContent className="max-h-[min(90dvh,44rem)] max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId == null ? 'Nova carta' : 'Editar carta'}</DialogTitle>
            <DialogDescription>
              Os campos disponíveis variam de acordo com o TCG e o tipo selecionado.
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
                <Label>TCG</Label>
                <div className="flex flex-wrap gap-2">
                  {TCG_OPTIONS.map((tcg) => (
                    <Button
                      key={tcg}
                      type="button"
                      size="sm"
                      variant={form.tcg === tcg ? 'default' : 'outline'}
                      onClick={() => handleTcgChange(tcg)}
                    >
                      {TCG_LABELS[tcg]}
                    </Button>
                  ))}
                </div>
              </div>

              {form.tcg ? (
                <div className="grid gap-2">
                  <Label>Tipo da carta</Label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={form.card_type === type ? 'default' : 'outline'}
                        onClick={() => handleTypeChange(type)}
                      >
                        {CARD_TYPE_LABELS[type]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {showEmptyNotice ? (
                <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Cartas DON não exigem informações adicionais — basta salvar.
                </p>
              ) : null}

              {showNameField ? (
                <div className="grid gap-2">
                  <Label htmlFor="card-name">Nome da carta</Label>
                  <Input
                    id="card-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex.: Monkey D. Luffy"
                    autoComplete="off"
                    required
                    disabled={submitting}
                  />
                </div>
              ) : null}

              {showEditionField ? (
                <div className="grid gap-2">
                  <Label htmlFor="card-edition">Edição</Label>
                  <Input
                    id="card-edition"
                    value={form.edition}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, edition: e.target.value }))
                    }
                    placeholder="Ex.: OP01 - Romance Dawn"
                    autoComplete="off"
                    required
                    disabled={submitting}
                  />
                </div>
              ) : null}

              {showColorsField ? (
                <div className="grid gap-2">
                  <Label>
                    Cores{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      (1 ou 2)
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => {
                      const selected = form.colors.includes(color)
                      const order = form.colors.indexOf(color)
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => toggleColor(color)}
                          disabled={submitting}
                          aria-pressed={selected}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                          )}
                        >
                          <span
                            className="size-3 rounded-full ring-1 ring-foreground/20"
                            style={{ backgroundColor: CARD_COLOR_HEX[color] }}
                            aria-hidden
                          />
                          {CARD_COLOR_LABELS[color]}
                          {selected ? (
                            <span className="ml-0.5 text-[10px] text-muted-foreground">
                              {order + 1}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  {form.colors.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Selecione 1 cor para mono, ou 2 cores para dual.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Salvando…
                    </>
                  ) : editingId == null ? (
                    'Cadastrar carta'
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <CardDetailDialog
        open={detailCard != null}
        card={detailCard}
        onOpenChange={(open) => {
          if (!open) setDetailCard(null)
        }}
        onEdit={(c) => openEdit(c)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <CardDescription>
            {loading
              ? 'Carregando cartas…'
              : `${cards.length} carta${cards.length === 1 ? '' : 's'}${
                  filter ? ` em ${TCG_LABELS[filter]}` : ' no total'
                }.`}
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
          ) : cards.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma carta cadastrada ainda. Clique em{' '}
              <strong>Nova carta</strong> para começar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">TCG</th>
                    <th className="py-2 pr-3 font-medium">Tipo</th>
                    <th className="py-2 pr-3 font-medium">Nome</th>
                    <th className="py-2 pr-3 font-medium">Edição</th>
                    <th className="py-2 pr-3 font-medium">Cores</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Cadastrada</th>
                    <th className="py-2 pl-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr
                      key={card.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-2 pr-3 text-muted-foreground">
                        {TCG_LABELS[card.tcg]}
                      </td>
                      <td className="py-2 pr-3">
                        {CARD_TYPE_LABELS[card.card_type]}
                      </td>
                      <td className="py-2 pr-3 font-medium text-foreground">
                        {card.name ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {card.edition ?? '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {card.colors.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            {card.colors.map((color) => (
                              <span
                                key={color}
                                title={CARD_COLOR_LABELS[color]}
                                aria-label={CARD_COLOR_LABELS[color]}
                                className="size-3 rounded-full ring-1 ring-foreground/20"
                                style={{
                                  backgroundColor: CARD_COLOR_HEX[color],
                                }}
                              />
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {STATUS_LABELS[card.status]}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatDate(card.created_at)}
                      </td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDetailCard(card)}
                            aria-label="Visualizar carta"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(card)}
                            aria-label="Editar carta"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete(card)}
                            disabled={deletingId === card.id}
                            aria-label="Remover carta"
                            className="hover:text-destructive"
                          >
                            {deletingId === card.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
