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
import { cn } from '@/lib/utils'
import {
  CARD_COLOR_HEX,
  CARD_COLOR_LABELS,
  CARD_TYPE_LABELS,
  STATUS_LABELS,
  TCG_LABELS,
  type TCard,
} from '@/modules/card/types/card.model'

export type CardDetailDialogProps = {
  open: boolean
  card: TCard | null
  onOpenChange: (open: boolean) => void
  onEdit?: (card: TCard) => void
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

export function CardDetailDialog({ open, card, onOpenChange, onEdit }: CardDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {card ? (
          <>
            <DialogHeader>
              <DialogTitle>Carta</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {TCG_LABELS[card.tcg]} — {CARD_TYPE_LABELS[card.card_type]}
                {card.name?.trim() ? ` — ${card.name.trim()}` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <dl className="space-y-3">
                <DetailItem label="ID">#{card.id}</DetailItem>
                <DetailItem label="TCG">{TCG_LABELS[card.tcg]}</DetailItem>
                <DetailItem label="Tipo">{CARD_TYPE_LABELS[card.card_type]}</DetailItem>
                <DetailItem label="Nome">{card.name?.trim() || '—'}</DetailItem>
                <DetailItem label="Edição">{card.edition?.trim() || '—'}</DetailItem>
                <DetailItem label="Status">{STATUS_LABELS[card.status]}</DetailItem>
              </dl>

              <Separator />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cores</p>
                {card.colors.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {card.colors.map((color) => (
                      <li
                        key={color}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium',
                        )}
                      >
                        <span
                          className="size-3 shrink-0 rounded-full ring-1 ring-foreground/20"
                          style={{ backgroundColor: CARD_COLOR_HEX[color] }}
                          aria-hidden
                        />
                        {CARD_COLOR_LABELS[color]}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator />
              <dl className="space-y-2">
                <DetailItem label="Cadastrada">{formatDt(card.created_at)}</DetailItem>
                <DetailItem label="Atualizada">{formatDt(card.updated_at)}</DetailItem>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
              {onEdit ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => {
                    onEdit(card)
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
