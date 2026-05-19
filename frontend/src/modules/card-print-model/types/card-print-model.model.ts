import { z } from 'zod'

import { CardType, Tcg } from '@/modules/card/types/card.model'

export const CardPrintModelCardSnapshot = z.object({
  id: z.number(),
  tcg: Tcg,
  card_type: CardType,
  name: z.string().nullable(),
  edition: z.string().nullable(),
})

export const CardPrintModelRow = z.object({
  id: z.number(),
  card_id: z.number(),
  name: z.string(),
  file_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
  card: CardPrintModelCardSnapshot,
})

export type TCardPrintModelRow = z.infer<typeof CardPrintModelRow>

export const ListCardPrintModelsResponse = z.object({
  items: z.array(CardPrintModelRow),
  pagination: z.object({
    total: z.number(),
    pages: z.number(),
  }),
})

export type TListCardPrintModelsResponse = z.infer<typeof ListCardPrintModelsResponse>

export const CardPrintModelBody = z.object({
  card_id: z.number().int().positive(),
  name: z.string().trim().min(1),
  file_name: z.string().trim().min(1),
})

export type TCardPrintModelBody = z.infer<typeof CardPrintModelBody>

export const CardPrintModelRecord = z.object({
  id: z.number(),
  card_id: z.number(),
  name: z.string(),
  file_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TCardPrintModelRecord = z.infer<typeof CardPrintModelRecord>
