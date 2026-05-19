import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ProductionShipmentStatus } from './list-production-shipments.schema';

export const PatchProductionShipmentParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TPatchProductionShipmentParams = z.infer<typeof PatchProductionShipmentParams>;

export const PatchProductionShipmentBody = z.object({
  status: ProductionShipmentStatus,
});

export type TPatchProductionShipmentBody = z.infer<typeof PatchProductionShipmentBody>;

export const PatchProductionShipmentResponse = z.object({
  id: z.number(),
  display_number: z.number(),
  status: ProductionShipmentStatus,
});

export type TPatchProductionShipmentResponse = z.infer<typeof PatchProductionShipmentResponse>;

export const PatchProductionShipmentSchema = {
  params: PatchProductionShipmentParams,
  body: PatchProductionShipmentBody,
  response: {
    200: PatchProductionShipmentResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
    409: ErrorResponse,
  },
  description: 'Atualiza o status de uma remessa (somente para frente).',
  tags: ['Production'],
};
