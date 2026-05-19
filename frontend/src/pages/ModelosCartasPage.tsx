import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { OrderLineCardCombobox } from '@/components/OrderLineCardCombobox'
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
import { listCardsService } from '@/modules/card/services/list-cards.service'
import {
  CARD_TYPE_LABELS,
  TCG_LABELS,
  type TCard,
  type TTcg,
} from '@/modules/card/types/card.model'
import { createCardPrintModelService } from '@/modules/card-print-model/services/create-card-print-model.service'
import { deleteCardPrintModelService } from '@/modules/card-print-model/services/delete-card-print-model.service'
import { listCardPrintModelsService } from '@/modules/card-print-model/services/list-card-print-models.service'
import { patchCardPrintModelService } from '@/modules/card-print-model/services/patch-card-print-model.service'
import type {
  TCardPrintModelBody,
  TCardPrintModelRow,
} from '@/modules/card-print-model/types/card-print-model.model'

type FormState = {
  card_id: number | null
  name: string
  file_name: string
}

const EMPTY_FORM: FormState = {
  card_id: null,
  name: '',
  file_name: '',
}

const TCG_FILTER_ORDER = ['one_piece', 'magic', 'pokemon'] as const satisfies readonly TTcg[]

function formatCardLabel(card: Pick<TCard, 'tcg' | 'card_type' | 'name' | 'edition'>): string {
  const tcg = TCG_LABELS[card.tcg]
  const type = CARD_TYPE_LABELS[card.card_type]
  const name = card.name?.trim()
  const edition = card.edition?.trim()
  const parts = [tcg, type]
  if (name) parts.push(name)
  if (edition) parts.push(`(${edition})`)
  return parts.join(' · ')
}

function formatShortDate(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value)
}

export function ModelosCartasPage() {
  const [rows, setRows] = useState<TCardPrintModelRow[]>([])
  const [cards, setCards] = useState<TCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTcg, setFilterTcg] = useState<TTcg | 'all'>('all')
  const [listError, setListError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TCardPrintModelRow | null>(null)
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY_FORM }))
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const q = search.trim()
      const data = await listCardPrintModelsService({
        ...(filterTcg !== 'all' ? { tcg: filterTcg } : {}),
        ...(q ? { q } : {}),
        limit: 500,
        sort_by: 'created_at',
        sort: 'desc',
      })
      setRows(data.items)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar os modelos.'
      setListError(msg)
    } finally {
      setLoading(false)
    }
  }, [filterTcg, search])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    void listCardsService({ limit: 500 }).then((d) => setCards(d.items))
  }, [])

  const cardsSorted = useMemo(
    () =>
      [...cards].sort((a, b) => formatCardLabel(a).localeCompare(formatCardLabel(b), 'pt-BR')),
    [cards],
  )

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: TCardPrintModelRow) {
    setEditing(row)
    setForm({
      card_id: row.card_id,
      name: row.name,
      file_name: row.file_name,
    })
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.card_id) {
      setFormError('Selecione a carta.')
      return
    }
    const name = form.name.trim()
    const file_name = form.file_name.trim()
    if (!name || !file_name) {
      setFormError('Preencha nome do modelo e nome do arquivo.')
      return
    }

    setFormError(null)
    setSubmitting(true)
    try {
      const body: TCardPrintModelBody = {
        card_id: form.card_id,
        name,
        file_name,
      }
      if (editing) {
        await patchCardPrintModelService(editing.id, { name, file_name })
      } else {
        await createCardPrintModelService(body)
      }
      closeForm()
      await refresh()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível salvar.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este modelo de impressão?')) return
    setDeletingId(id)
    try {
      await deleteCardPrintModelService(id)
      await refresh()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível excluir.'
      setListError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Modelos de cartas</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre o nome do arquivo de arte por modelo para cada carta. Nas encomendas, o modelo é{' '}
          <strong>obrigatório</strong> por linha.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:gap-4">
          <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-[200px] sm:max-w-md">
            <Label
              htmlFor="model-search"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Buscar
            </Label>
            <Input
              id="model-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Modelo, arquivo ou nome da carta"
              aria-label="Buscar por nome do modelo, arquivo ou nome da carta"
            />
          </div>
          <div className="grid min-w-0 gap-1.5 sm:max-w-[200px]">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">TCG</Label>
            <Select
              value={filterTcg}
              onValueChange={(v) => setFilterTcg(v === 'all' ? 'all' : (v as TTcg))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os TCG</SelectItem>
                {TCG_FILTER_ORDER.map((tcg) => (
                  <SelectItem key={tcg} value={tcg}>
                    {TCG_LABELS[tcg]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="button" size="sm" className="gap-1.5" onClick={() => openCreate()}>
          <Plus className="size-3.5" />
          Novo modelo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos cadastrados</CardTitle>
          <CardDescription>
            {loading ? 'Carregando…' : `${rows.length} modelo${rows.length === 1 ? '' : 's'}.`}
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Carta</th>
                  <th className="py-2 pr-3 font-medium">Modelo</th>
                  <th className="py-2 pr-3 font-medium">Arquivo</th>
                  <th className="py-2 pr-3 font-medium">Atualizado</th>
                  <th className="w-[120px] py-2 pl-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando modelos…
                      </span>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhum modelo encontrado.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 align-top">
                        <span className="font-medium">{formatCardLabel(row.card)}</span>
                      </td>
                      <td className="py-2 pr-3 align-top">{row.name}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs">{row.file_name}</td>
                      <td className="py-2 pr-3 align-top text-muted-foreground">
                        {formatShortDate(row.updated_at ?? row.created_at)}
                      </td>
                      <td className="py-2 pl-3 align-top text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Editar modelo"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            aria-label="Excluir modelo"
                            disabled={deletingId === row.id}
                            onClick={() => void handleDelete(row.id)}
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar modelo' : 'Novo modelo'}</DialogTitle>
            <DialogDescription>
              O arquivo deve refletir como você nomeia o arquivo enviado à gráfica para esta variante.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 pt-2" onSubmit={(e) => void handleSubmit(e)}>
            {formError ? (
              <p
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="model-form-card">Carta</Label>
              <OrderLineCardCombobox
                id="model-form-card"
                cards={cardsSorted}
                cardId={form.card_id}
                onCardChange={(next) => setForm((prev) => ({ ...prev, card_id: next }))}
                disabled={submitting || editing != null}
                formatCardLabel={formatCardLabel}
              />
              {editing ? (
                <p className="text-xs text-muted-foreground">A carta não pode ser alterada.</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model-name">Nome do modelo</Label>
              <Input
                id="model-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                disabled={submitting}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model-file">Nome do arquivo</Label>
              <Input
                id="model-file"
                value={form.file_name}
                onChange={(e) => setForm((p) => ({ ...p, file_name: e.target.value }))}
                disabled={submitting}
                required
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Salvando…
                  </>
                ) : editing ? (
                  'Salvar'
                ) : (
                  'Cadastrar'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
