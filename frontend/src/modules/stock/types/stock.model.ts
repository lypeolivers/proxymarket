import { z } from 'zod'
import { Card } from '@/modules/card/types/card.model'

export const StockRow = z.object({
  card: Card,
  on_hand: z.number().int(),
  demand_open: z.number().int(),
  demand_quote: z.number().int(),
  demand_pending_print: z.number().int(),
  need_for_graphic: z.number().int(),
  available_after_orders: z.number().int(),
  need_to_produce: z.number().int(),
})

export type TStockRow = z.infer<typeof StockRow>

export const ListStockResponse = z.object({
  items: z.array(StockRow),
  pagination: z.object({
    total: z.number(),
    pages: z.number(),
  }),
})

export type TListStockResponse = z.infer<typeof ListStockResponse>

export const PatchStockResponse = StockRow

export type TPatchStockResponse = z.infer<typeof PatchStockResponse>
