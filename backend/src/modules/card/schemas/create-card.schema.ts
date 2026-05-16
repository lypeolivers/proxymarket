import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { Status } from '../../../common/schemas/status.schema';
import { CardColor } from '../../../common/schemas/tcg.schema';
import { CardEntity } from '../entities/card.entity';

const OnePieceLeader = z.object({
  tcg: z.literal('one_piece'),
  card_type: z.literal('leader'),
  name: z.string().trim().min(1, 'Informe o nome do líder.'),
  edition: z.string().trim().min(1, 'Informe a edição da carta.'),
  colors: z
    .array(CardColor)
    .min(1, 'Selecione ao menos uma cor.')
    .max(2, 'Selecione no máximo duas cores.'),
  status: Status.optional(),
});

const OnePieceDon = z.object({
  tcg: z.literal('one_piece'),
  card_type: z.literal('don'),
  status: Status.optional(),
});

const MagicToken = z.object({
  tcg: z.literal('magic'),
  card_type: z.literal('token'),
  name: z.string().trim().min(1, 'Informe o nome da carta.'),
  status: Status.optional(),
});

const MagicCommander = z.object({
  tcg: z.literal('magic'),
  card_type: z.literal('commander'),
  name: z.string().trim().min(1, 'Informe o nome da carta.'),
  status: Status.optional(),
});

const PokemonBase = z.object({
  tcg: z.literal('pokemon'),
  name: z.string().trim().min(1, 'Informe o nome da carta.'),
  status: Status.optional(),
});

const PokemonPokemon = PokemonBase.extend({ card_type: z.literal('pokemon') });
const PokemonSupporter = PokemonBase.extend({ card_type: z.literal('supporter') });
const PokemonItem = PokemonBase.extend({ card_type: z.literal('item') });
const PokemonStadium = PokemonBase.extend({ card_type: z.literal('stadium') });
const PokemonTool = PokemonBase.extend({ card_type: z.literal('tool') });

export const CreateCardBody = z.discriminatedUnion('card_type', [
  OnePieceLeader,
  OnePieceDon,
  MagicToken,
  MagicCommander,
  PokemonPokemon,
  PokemonSupporter,
  PokemonItem,
  PokemonStadium,
  PokemonTool,
]);

export type TCreateCardBody = z.infer<typeof CreateCardBody>;

export const CreateCardResponse = CardEntity;
export type TCreateCardResponse = z.infer<typeof CreateCardResponse>;

export const CreateCardSchema = {
  body: CreateCardBody,
  response: {
    201: CreateCardResponse,
    400: ErrorResponse,
    401: ErrorResponse,
  },
  description: 'Cria uma carta no catálogo (campos variam por TCG e tipo).',
  tags: ['Card'],
};
