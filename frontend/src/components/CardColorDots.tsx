import { cn } from '@/lib/utils'
import {
  CARD_COLOR_HEX,
  type TCardColor,
} from '@/modules/card/types/card.model'

type CardColorDotsProps = {
  colors: readonly TCardColor[]
  className?: string
}

export function CardColorDots({ colors, className }: CardColorDotsProps) {
  if (!colors.length) {
    return (
      <span className={cn('inline-block text-muted-foreground', className)} aria-hidden>
        —
      </span>
    )
  }

  return (
    <span
      className={cn('inline-flex shrink-0 items-center gap-0.5', className)}
      aria-hidden
      title={`${colors.length} cor(es)`}
    >
      {colors.map((color) => (
        <span
          key={color}
          className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/25"
          style={{ backgroundColor: CARD_COLOR_HEX[color] }}
        />
      ))}
    </span>
  )
}
