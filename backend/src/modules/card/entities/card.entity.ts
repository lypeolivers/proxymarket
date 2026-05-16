import { z } from 'zod';
import { Status } from '../../../common/schemas/status.schema';
import { CardColor, CardType, Tcg } from '../../../common/schemas/tcg.schema';

export const CardEntity = z.object({
  id: z.number(),
  tcg: Tcg,
  card_type: CardType,
  name: z.string().nullable(),
  edition: z.string().nullable(),
  colors: z.array(CardColor),
  status: Status,
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TCardEntity = z.infer<typeof CardEntity>;
