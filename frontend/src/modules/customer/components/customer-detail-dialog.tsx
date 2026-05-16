import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { displayBrazilPhone } from '@/lib/brazil-phone'
import { BRAZIL_UF_EXTENDED_LABELS } from '@/lib/brazil-regions'
import type { TCustomer } from '@/modules/customer/types/customer.model'

export type CustomerDetailDialogProps = {
  open: boolean
  customer: TCustomer | null
  onOpenChange: (open: boolean) => void
  onEdit?: (customer: TCustomer) => void
}

function formatDt(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value)
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-4 sm:items-start">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm leading-snug text-foreground">{children}</span>
    </div>
  )
}

export function CustomerDetailDialog({
  open,
  customer,
  onOpenChange,
  onEdit,
}: CustomerDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {customer ? (
          <>
            <DialogHeader>
              <DialogTitle>Cliente</DialogTitle>
              <DialogDescription className="line-clamp-2">{customer.name}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <dl className="space-y-3">
                <DetailItem label="ID">#{customer.id}</DetailItem>
                <DetailItem label="Nome">{customer.name}</DetailItem>
                <DetailItem label="Celular">{displayBrazilPhone(customer.phone)}</DetailItem>
                <DetailItem label="E-mail">{customer.email?.trim() || '—'}</DetailItem>
                <DetailItem label="Cidade">{customer.city?.trim() || '—'}</DetailItem>
                <DetailItem label="UF">
                  {customer.state?.trim()
                    ? `${customer.state.trim()} — ${BRAZIL_UF_EXTENDED_LABELS[customer.state.trim() as keyof typeof BRAZIL_UF_EXTENDED_LABELS] ?? customer.state}`
                    : '—'}
                </DetailItem>
              </dl>

              {customer.notes?.trim() ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Observações
                    </p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                      {customer.notes.trim()}
                    </p>
                  </div>
                </>
              ) : null}

              <Separator />
              <dl className="space-y-2">
                <DetailItem label="Cadastrado">{formatDt(customer.created_at)}</DetailItem>
                <DetailItem label="Atualizado">{formatDt(customer.updated_at)}</DetailItem>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
              {onEdit ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => {
                    onEdit(customer)
                    onOpenChange(false)
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Editar
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
