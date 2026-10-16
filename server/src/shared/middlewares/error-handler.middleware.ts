import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.ts';
import { logger } from '../logger/logger.ts';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as any).id || 'req-unknown';

  if (err instanceof AppError) {
    logger.warn(`[Operacional ${err.status}] ${err.message}`, {
      requestId,
      code: err.code,
      status: err.status,
      method: req.method,
      path: req.originalUrl,
      details: err.details,
    });

    res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
        details: err.details,
        correlationId: requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn(`[Validação Zod] Erro de validação de schema`, {
      requestId,
      issues: err.issues,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Falha na validação dos dados de entrada.',
        status: 400,
        details: err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
          code: i.code,
        })),
        correlationId: requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err?.type === 'entity.too.large') {
    logger.warn(`[Payload Excessivo] Tentativa de envio com tamanho excedido`, {
      requestId,
      limit: err.limit,
    });

    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'O payload da requisição excede o limite máximo configurado (25MB).',
        status: 413,
        correlationId: requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Erros inesperados
  logger.error(`[Erro Não Tratado 500] ${err?.message || 'Erro Interno do Servidor'}`, {
    requestId,
    name: err?.name,
    message: err?.message,
    method: req.method,
    path: req.originalUrl,
    stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'Ocorreu um erro interno ao processar sua solicitação.'
        : err?.message || 'Erro Interno',
      status: 500,
      correlationId: requestId,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { stack: err?.stack }),
    },
  });
}
