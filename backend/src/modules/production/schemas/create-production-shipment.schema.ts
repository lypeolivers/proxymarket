import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ProductionShipmentStatus } from './list-production-shipments.schema';

export const CreateProductionShipmentBody = z.object({
  /** Para arquivo histórico use `printing` ou `printed` se já existir remessa em aguardando impressão. */
  status: ProductionShipmentStatus.optional(),
});

export type TCreateProductionShipmentBody = z.infer<typeof CreateProductionShipmentBody>;

export const CreateProductionShipmentResponse = z.object({
  id: z.number(),
  display_number: z.number(),
  status: ProductionShipmentStatus,
});

export type TCreateProductionShipmentResponse = z.infer<typeof CreateProductionShipmentResponse>;

export const CreateProductionShipmentSchema = {
  body: CreateProductionShipmentBody,
  response: {
    201: CreateProductionShipmentResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    409: ErrorResponse,
  },
  description:
    'Cria uma remessa manualmente (próximo # sequencial). Só pode existir uma em “Aguardando impressão”; para segunda remessa aberta use outro status.',
  tags: ['Production'],
};
