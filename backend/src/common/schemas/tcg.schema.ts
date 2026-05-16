import { z } from 'zod';

export const Tcg = z.enum(['one_piece', 'magic', 'pokemon']);

export const CardColor = z.enum(['blue', 'yellow', 'green', 'black', 'red', 'purple']);

export const CardType = z.enum([
  'leader',
  'don',
  'token',
  'commander',
  'pokemon',
  'supporter',
  'item',
  'stadium',
  'tool',
]);

export type TTcg = z.infer<typeof Tcg>;
export type TCardColor = z.infer<typeof CardColor>;
export type TCardType = z.infer<typeof CardType>;
