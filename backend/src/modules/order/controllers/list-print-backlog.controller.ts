import { FastifyReply, FastifyRequest } from 'fastify';
import {
  PrintBacklogQuery,
  TPrintBacklogQuery,
  TPrintBacklogResponse,
} from '../schemas/print-backlog.schema';
import { listPrintBacklogService } from '../services/list-print-backlog.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TPrintBacklogQuery; Reply: TPrintBacklogResponse }>,
  reply: FastifyReply
) {
  const query = PrintBacklogQuery.parse(request.query);
  const result = await listPrintBacklogService.execute(query);
  reply.status(200).send(result);
}
