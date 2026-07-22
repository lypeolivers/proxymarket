import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { TCustomer } from '@/modules/customer/types/customer.model'

function formatCustomerLabel(customer: TCustomer): string {
  const loc =
    [customer.city?.trim(), customer.state?.trim()].filter(Boolean).length > 0
      ? `${[customer.city, customer.state].filter(Boolean).join(' / ')}`
      : null
  return loc ? `${customer.name} (${loc})` : customer.name
}

function sortCustomersByName(customers: TCustomer[]): TCustomer[] {
  return [...customers].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  )
}

type OrderCustomerComboboxProps = {
  customers: TCustomer[]
  customerId: number | null
  onCustomerChange: (nextId: number | null) => void
  disabled?: boolean
  id?: string
  'aria-invalid'?: boolean
}

export function OrderCustomerCombobox({
  customers,
  customerId,
  onCustomerChange,
  disabled,
  id,
  'aria-invalid': ariaInvalid,
}: OrderCustomerComboboxProps) {
  const reactId = useId()
  const searchFieldId = id ? `${id}-search` : `${reactId}-search`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const sortedCustomers = useMemo(() => sortCustomersByName(customers), [customers])

  const selectedCustomer =
    customerId != null ? customers.find((c) => c.id === customerId) : undefined

  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLowerCase()
    const base =
      term === ''
        ? sortedCustomers
        : sortedCustomers.filter((c) => c.name.toLowerCase().includes(term))

    if (selectedCustomer != null && !base.some((c) => c.id === selectedCustomer.id)) {
      return sortCustomersByName([selectedCustomer, ...base])
    }

    return base
  }, [sortedCustomers, query, selectedCustomer])

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
          data-slot="customer-combobox-trigger"
          className={cn(
            'h-9 w-full min-w-0 justify-between gap-2 px-3 py-2 font-normal',
            !selectedCustomer && 'text-muted-foreground',
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedCustomer ? formatCustomerLabel(selectedCustomer) : 'Selecionar cliente'}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        <label className="sr-only" htmlFor={searchFieldId}>
          Buscar cliente pelo nome
        </label>
        <Input
          ref={searchRef}
          id={searchFieldId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar pelo nome…"
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
                aria-selected={customerId === null}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                onClick={() => {
                  onCustomerChange(null)
                  setOpen(false)
                }}
              >
                <span className="text-muted-foreground">Selecionar cliente</span>
              </button>
            </li>
            {filteredCustomers.map((customer) => {
              const selected = customerId === customer.id
              return (
                <li key={customer.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
                      selected && 'bg-accent/60',
                    )}
                    onClick={() => {
                      onCustomerChange(customer.id)
                      setOpen(false)
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {formatCustomerLabel(customer)}
                    </span>
                    {selected ? <Check className="size-4 shrink-0 opacity-70" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          {filteredCustomers.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
