import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import { env } from '../../config/env.js';

export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 1. Handle AppError (Trusted operational errors)
  if (error instanceof AppError) {
    request.log.warn({
      err: error,
      code: error.code,
      statusCode: error.statusCode,
    }, error.message);

    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  // 2. Handle Zod Validation Errors
  if (error instanceof ZodError || (error as any).name === 'ZodError') {
    // If it's not an instance but has name ZodError, cast it
    const zodError = error as ZodError;
    const message = zodError.errors ? zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') : 'Validation error';
    
    request.log.warn({ err: error }, 'Validation Error');

    return reply.status(400).send({
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      details: zodError.errors,
    });
  }

  // 3. Handle Fastify Validation Errors (if any pass through)
  if ((error as FastifyError).validation) {
    return reply.status(400).send({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // 4. Handle Unexpected Errors (500)
  request.log.error({ 
    err: error,
    reqId: request.id,
    method: request.method,
    url: request.url,
    body: request.body 
  }, 'Unexpected Server Error');

  const message = env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : error.message;

  return reply.status(500).send({
    success: false,
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
