import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { CardColorDots } from '@/components/CardColorDots'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { TCard } from '@/modules/card/types/card.model'

type OrderLineCardComboboxProps = {
  cards: TCard[]
  cardId: number | null
  onCardChange: (nextId: number | null) => void
  disabled?: boolean
  formatCardLabel: (card: TCard) => string
  id?: string
  'aria-invalid'?: boolean
}

export function OrderLineCardCombobox({
  cards,
  cardId,
  onCardChange,
  disabled,
  formatCardLabel,
  id,
  'aria-invalid': ariaInvalid,
}: OrderLineCardComboboxProps) {
  const reactId = useId()
  const searchFieldId = id ? `${id}-search` : `${reactId}-search`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedCard = cardId != null ? cards.find((c) => c.id === cardId) : undefined

  const filteredCards = useMemo(() => {
    const term = query.trim().toLowerCase()
    const base =
      term === ''
        ? cards
        : cards.filter((c) => formatCardLabel(c).toLowerCase().includes(term))

    if (selectedCard != null && !base.some((c) => c.id === selectedCard.id)) {
      return [selectedCard, ...base]
    }

    return base
  }, [cards, query, selectedCard, formatCardLabel])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      setQuery('')
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-invalid={ariaInvalid}
          data-slot="card-combobox-trigger"
          className={cn(
            'h-8 w-full min-w-0 justify-between gap-2 px-2.5 py-1 font-normal',
            !selectedCard && 'text-muted-foreground',
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            {selectedCard ? (
              <>
                <CardColorDots colors={selectedCard.colors} className="shrink-0" />
                <span className="truncate">{formatCardLabel(selectedCard)}</span>
              </>
            ) : (
              'Selecionar carta'
            )}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        <label className="sr-only" htmlFor={searchFieldId}>
          Buscar carta
        </label>
        <Input
          ref={searchRef}
          id={searchFieldId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no catálogo…"
          disabled={disabled}
          className="mb-2 h-8"
          autoComplete="off"
        />
        <div className="max-h-60 overflow-y-auto rounded-md border border-border/60">
          <ul className="p-1" role="listbox">
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={cardId === null}
                className={cn(
                  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
                )}
                onClick={() => {
                  onCardChange(null)
                  setOpen(false)
                }}
              >
                <span className="text-muted-foreground">Limpar seleção</span>
              </button>
            </li>
            {filteredCards.map((card) => {
              const selected = cardId === card.id
              return (
                <li key={card.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
                      selected && 'bg-accent/60',
                    )}
                    onClick={() => {
                      onCardChange(card.id)
                      setOpen(false)
                    }}
                  >
                    <CardColorDots colors={card.colors} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{formatCardLabel(card)}</span>
                    {selected ? <Check className="size-4 shrink-0 opacity-70" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          {filteredCards.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhuma carta encontrada.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
