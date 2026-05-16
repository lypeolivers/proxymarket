import { z } from 'zod'

export const Tcg = z.enum(['one_piece', 'magic', 'pokemon'])
export type TTcg = z.infer<typeof Tcg>

export const CardColor = z.enum([
  'blue',
  'yellow',
  'green',
  'black',
  'red',
  'purple',
])
export type TCardColor = z.infer<typeof CardColor>

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
])
export type TCardType = z.infer<typeof CardType>

export const Status = z.enum(['active', 'inactive', 'blocked', 'pending'])
export type TStatus = z.infer<typeof Status>

export const Card = z.object({
  id: z.number(),
  tcg: Tcg,
  card_type: CardType,
  name: z.string().nullable(),
  edition: z.string().nullable(),
  colors: z.array(CardColor),
  status: Status,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TCard = z.infer<typeof Card>

const OnePieceLeaderBody = z.object({
  tcg: z.literal('one_piece'),
  card_type: z.literal('leader'),
  name: z.string().trim().min(1),
  edition: z.string().trim().min(1),
  colors: z.array(CardColor).min(1).max(2),
  status: Status.optional(),
})

const OnePieceDonBody = z.object({
  tcg: z.literal('one_piece'),
  card_type: z.literal('don'),
  status: Status.optional(),
})

const MagicBody = z.object({
  tcg: z.literal('magic'),
  card_type: z.enum(['token', 'commander']),
  name: z.string().trim().min(1),
  status: Status.optional(),
})

const PokemonBody = z.object({
  tcg: z.literal('pokemon'),
  card_type: z.enum(['pokemon', 'supporter', 'item', 'stadium', 'tool']),
  name: z.string().trim().min(1),
  status: Status.optional(),
})

export const CardBody = z.union([
  OnePieceLeaderBody,
  OnePieceDonBody,
  MagicBody,
  PokemonBody,
])

export type TCardBody = z.infer<typeof CardBody>

export const ListCardsResponse = z.object({
  items: z.array(Card),
  pagination: z.object({
    total: z.number(),
    pages: z.number(),
  }),
})

export type TListCardsResponse = z.infer<typeof ListCardsResponse>

export const DeleteCardResponse = z.object({
  id: z.number(),
})

export type TDeleteCardResponse = z.infer<typeof DeleteCardResponse>

export const TCG_LABELS: Record<TTcg, string> = {
  one_piece: 'One Piece',
  magic: 'Magic: The Gathering',
  pokemon: 'Pokémon',
}

export const CARD_TYPE_LABELS: Record<TCardType, string> = {
  leader: 'Líder',
  don: 'DON',
  token: 'Ficha',
  commander: 'Comandante',
  pokemon: 'Pokémon',
  supporter: 'Apoiador',
  item: 'Item',
  stadium: 'Estádio',
  tool: 'Ferramenta',
}

export const CARD_TYPES_BY_TCG: Record<TTcg, TCardType[]> = {
  one_piece: ['leader', 'don'],
  magic: ['token', 'commander'],
  pokemon: ['pokemon', 'supporter', 'item', 'stadium', 'tool'],
}

export const CARD_COLOR_LABELS: Record<TCardColor, string> = {
  blue: 'Azul',
  yellow: 'Amarelo',
  green: 'Verde',
  black: 'Preto',
  red: 'Vermelho',
  purple: 'Roxo',
}

export const CARD_COLOR_HEX: Record<TCardColor, string> = {
  blue: '#3b82f6',
  yellow: '#facc15',
  green: '#22c55e',
  black: '#1f1f1f',
  red: '#ef4444',
  purple: '#a855f7',
}

export const STATUS_LABELS: Record<TStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  blocked: 'Bloqueada',
  pending: 'Pendente',
}
