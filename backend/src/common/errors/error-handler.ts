import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { VALIDATION_ERROR_MESSAGE, parseZodValidation, ValidationErrorItem } from './zod-error';

type ZodLikeError = Parameters<typeof parseZodValidation>[0];

type HandlerError = {
  name?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  code?: string;
  error_code?: string;
  issues?: unknown;
  details?: { issues?: unknown };
};

function isHandlerError(error: unknown): error is HandlerError {
  return typeof error === 'object' && error !== null;
}

export async function register(app: FastifyInstance) {
  app.setErrorHandler(async (error: unknown, _request: FastifyRequest, reply: FastifyReply) => {
    const errForLog = error instanceof Error ? error : new Error(String(error));
    console.error(
      '[ERROR HANDLER]',
      errForLog.message,
      errForLog.stack?.split('\n').slice(0, 3).join(' | ')
    );

    let validationErrors: ValidationErrorItem[] = [];

    if (!isHandlerError(error)) {
      reply.status(500).send({
        message:
          'Ops... Não foi possível realizar essa operação. Caso o comportamento se repita entre em contato com o suporte.',
        code: 500,
      });
      return;
    }

    if (error.name === 'ResponseValidationError' && error.details?.issues) {
      validationErrors = parseZodValidation(error.details as ZodLikeError);
    } else if (error.name === 'ZodError' && error.issues) {
      validationErrors = parseZodValidation(error as ZodLikeError);
    }

    if (validationErrors.length > 0) {
      reply.status(422).send({
        message: VALIDATION_ERROR_MESSAGE,
        details: validationErrors,
      });
    } else if (error.name === 'ApiError') {
      reply.status(error.status ?? 400).send({ message: error.message, code: error.error_code });
    } else if (error.name === 'Forbidden') {
      reply.status(403).send({ message: error.message, code: 'forbidden' });
    } else {
      reply.status(500).send({
        message:
          'Ops... Não foi possível realizar essa operação. Caso o comportamento se repita entre em contato com o suporte.',
        code: 500,
      });
    }
  });
}
