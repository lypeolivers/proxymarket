import { z } from 'zod';
import { CardType, Tcg } from '../../../common/schemas/tcg.schema';

export const CardPrintModelCardSnapshot = z.object({
  id: z.number(),
  tcg: Tcg,
  card_type: CardType,
  name: z.string().nullable(),
  edition: z.string().nullable(),
});

export const CardPrintModelEntity = z.object({
  id: z.number(),
  card_id: z.number(),
  name: z.string(),
  file_name: z.string(),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TCardPrintModelEntity = z.infer<typeof CardPrintModelEntity>;

export const CardPrintModelListRow = CardPrintModelEntity.extend({
  card: CardPrintModelCardSnapshot,
});

export type TCardPrintModelListRow = z.infer<typeof CardPrintModelListRow>;
