import { z } from 'zod';
import { CardEntity } from '../../card/entities/card.entity';

export const StockRowEntity = z.object({
  card: CardEntity,
  on_hand: z.number().int(),
  demand_open: z.number().int(),
  demand_quote: z.number().int(),
  demand_pending_print: z.number().int(),
  need_for_graphic: z.number().int(),
  available_after_orders: z.number().int(),
  need_to_produce: z.number().int(),
});

export type TStockRowEntity = z.infer<typeof StockRowEntity>;
