import { z } from 'zod'
import { Card } from '@/modules/card/types/card.model'

export const GraphicSummaryLine = z.object({
  card: Card,
  quantity: z.number().int(),
})

export type TGraphicSummaryLine = z.infer<typeof GraphicSummaryLine>

export const GraphicSummaryResponse = z.object({
  lines: z.array(GraphicSummaryLine),
  total_units: z.number().int(),
  clipboard_text: z.string(),
  generated_at: z.coerce.date(),
})

export type TGraphicSummaryResponse = z.infer<typeof GraphicSummaryResponse>
