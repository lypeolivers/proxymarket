import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { OrderPipelineStatus } from '../../../common/schemas/order.schema';

export const PrintBacklogQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type TPrintBacklogQuery = z.infer<typeof PrintBacklogQuery>;

export const PrintBacklogItem = z.object({
  order_id: z.number(),
  customer_name: z.string(),
  order_status: OrderPipelineStatus,
  pending_print_lines: z.number().int(),
  missing_model_lines: z.number().int(),
  total_units: z.number().int(),
});

export const PrintBacklogResponse = z.object({
  items: z.array(PrintBacklogItem),
});

export type TPrintBacklogResponse = z.infer<typeof PrintBacklogResponse>;

export const PrintBacklogSchema = {
  querystring: PrintBacklogQuery,
  response: {
    200: PrintBacklogResponse,
    401: ErrorResponse,
  },
  description:
    'Pedidos comprometidos com linhas que ainda demandam impressão na gráfica (exclui orçamento, entregue e linhas atendidas do estoque).',
  tags: ['Order'],
};
