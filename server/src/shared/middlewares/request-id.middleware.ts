import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../logger/logger.ts';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('X-Request-Id');
  const requestId = incomingId && incomingId.length <= 64 ? incomingId : `req-${crypto.randomUUID()}`;

  (req as any).id = requestId;
  (req as any).startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);

  logger.debug('Requisição HTTP iniciada', {
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
  });

  res.on('finish', () => {
    const durationMs = Date.now() - ((req as any).startTime || Date.now());
    const isError = res.statusCode >= 400;
    const logFn = isError
      ? res.statusCode >= 500
        ? logger.error
        : logger.warn
      : logger.info;

    logFn.call(logger, `HTTP ${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
