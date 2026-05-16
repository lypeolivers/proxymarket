import { useCallback, useEffect, useState } from 'react'
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
import {
  displayBrazilPhone,
  formatBrazilPhoneInput,
  phoneDigitsToApi,
} from '@/lib/brazil-phone'
import { BRAZIL_UF_CODES, BRAZIL_UF_EXTENDED_LABELS } from '@/lib/brazil-regions'
import { CustomerDetailDialog } from '@/modules/customer/components/customer-detail-dialog'
import { createCustomerService } from '@/modules/customer/services/create-customer.service'
import { deleteCustomerService } from '@/modules/customer/services/delete-customer.service'
import { listCustomersService } from '@/modules/customer/services/list-customers.service'
import { updateCustomerService } from '@/modules/customer/services/update-customer.service'
import type { TCustomer, TCustomerBody } from '@/modules/customer/types/customer.model'

type FormState = {
  name: string
  phone: string
  email: string
  city: string
  state: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  notes: '',
}

function customerToForm(customer: TCustomer): FormState {
  return {
    name: customer.name,
    phone: formatBrazilPhoneInput(customer.phone ?? ''),
    email: customer.email ?? '',
    city: customer.city ?? '',
    state: customer.state ?? '',
    notes: customer.notes ?? '',
  }
}

function buildBody(form: FormState): TCustomerBody {
  const stateRaw = form.state.trim().toUpperCase()
  return {
    name: form.name.trim(),
    phone: phoneDigitsToApi(form.phone),
    email: form.email.trim() || null,
    city: form.city.trim() ? form.city.trim().slice(0, 120) : null,
    state: stateRaw ? (stateRaw as TCustomerBody['state']) : null,
    notes: form.notes.trim() || null,
  }
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value)
}

export function ClientesPage() {
  const [customers, setCustomers] = useState<TCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [listError, setListError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<TCustomer | null>(null)

  const refresh = useCallback(async (query: string) => {
    setLoading(true)
    setListError(null)
    try {
      const data = await listCustomersService(query.trim() ? { q: query.trim() } : {})
      setCustomers(data.items)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar os clientes.'
      setListError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(search)
  }, [refresh, search])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(customer: TCustomer) {
    setEditingId(customer.id)
    setForm(customerToForm(customer))
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    try {
      const body = buildBody(form)
      setSubmitting(true)
      if (editingId == null) {
        await createCustomerService(body)
      } else {
        await updateCustomerService(editingId, body)
      }
      closeForm()
      await refresh(search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível salvar o cliente.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(customer: TCustomer) {
    const confirmed = window.confirm(
      `Remover o cliente "${customer.name}"? Essa ação pode ser revertida via banco (soft delete).`,
    )
    if (!confirmed) return

    setDeletingId(customer.id)
    try {
      await deleteCustomerService(customer.id)
      await refresh(search)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível remover o cliente.'
      setListError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre compradores para vincular às encomendas e manter histórico.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-md">
          <Label
            htmlFor="customer-search"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            Buscar
          </Label>
          <Input
            id="customer-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, e-mail, telefone, cidade ou UF"
            aria-label="Buscar clientes"
          />
        </div>
        {!formOpen ? (
          <Button type="button" size="sm" className="shrink-0" onClick={openCreate}>
            <Plus className="size-3.5" />
            Novo cliente
          </Button>
        ) : null}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId == null ? 'Novo cliente' : 'Editar cliente'}</DialogTitle>
            <DialogDescription>
              Informações básicas para identificar quem fez a encomenda.
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
                <Label htmlFor="customer-name">Nome</Label>
                <Input
                  id="customer-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-phone">Celular</Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(11) 98765-4321"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: formatBrazilPhoneInput(e.target.value),
                      }))
                    }
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-city">Cidade</Label>
                  <Input
                    id="customer-city"
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Ex.: São Paulo"
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-state">Estado (UF)</Label>
                  <Select
                    value={form.state || 'none'}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, state: v === 'none' ? '' : v }))
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger id="customer-state" aria-label="Estado UF">
                      <SelectValue placeholder="Selecionar UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não informado</SelectItem>
                      {BRAZIL_UF_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code} — {BRAZIL_UF_EXTENDED_LABELS[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-notes">Observações</Label>
                <Input
                  id="customer-notes"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Salvando…
                    </>
                  ) : editingId == null ? (
                    'Cadastrar cliente'
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                  Cancelar
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <CustomerDetailDialog
        open={detailCustomer != null}
        customer={detailCustomer}
        onOpenChange={(open) => {
          if (!open) setDetailCustomer(null)
        }}
        onEdit={(c) => openEdit(c)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes</CardTitle>
          <CardDescription>
            {loading
              ? 'Carregando clientes…'
              : `${customers.length} cliente${customers.length === 1 ? '' : 's'} encontrado${customers.length === 1 ? '' : 's'}.`}
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
          ) : customers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Nome</th>
                    <th className="py-2 pr-3 font-medium">Cidade</th>
                    <th className="py-2 pr-3 font-medium">UF</th>
                    <th className="py-2 pr-3 font-medium">Celular</th>
                    <th className="py-2 pr-3 font-medium">E-mail</th>
                    <th className="py-2 pr-3 font-medium">Cadastrado</th>
                    <th className="py-2 pl-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-3 font-medium">{customer.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{customer.city ?? '—'}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{customer.state ?? '—'}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground tabular-nums">
                        {displayBrazilPhone(customer.phone)}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{customer.email ?? '—'}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDetailCustomer(customer)}
                            aria-label="Visualizar cliente"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(customer)}
                            aria-label="Editar cliente"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete(customer)}
                            disabled={deletingId === customer.id}
                            aria-label="Remover cliente"
                            className="hover:text-destructive"
                          >
                            {deletingId === customer.id ? (
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
