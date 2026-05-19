import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const PatchProductionOrderItemArtParams = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export type TPatchProductionOrderItemArtParams = z.infer<
  typeof PatchProductionOrderItemArtParams
>;

/** Arte editável só entre estes dois valores na Produção. */
export const ProductionEditableArtStatus = z.enum(['art_to_do', 'art_ready']);

export type TProductionEditableArtStatus = z.infer<typeof ProductionEditableArtStatus>;

export const PatchProductionOrderItemArtBody = z.object({
  art_status: ProductionEditableArtStatus,
});

export type TPatchProductionOrderItemArtBody = z.infer<
  typeof PatchProductionOrderItemArtBody
>;

export const PatchProductionOrderItemArtResponse = z.object({
  ok: z.literal(true),
  art_status: ProductionEditableArtStatus,
});

export type TPatchProductionOrderItemArtResponse = z.infer<
  typeof PatchProductionOrderItemArtResponse
>;

export const PatchProductionOrderItemArtSchema = {
  params: PatchProductionOrderItemArtParams,
  body: PatchProductionOrderItemArtBody,
  response: {
    200: PatchProductionOrderItemArtResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Alterna arte da linha (somente arte a fazer / arte pronta) dentro da remessa.',
  tags: ['Production'],
};
