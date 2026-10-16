import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.ts';
import { logger } from '../logger/logger.ts';

export function createCorsMiddleware() {
  const rawOrigins = env.CORS_ORIGIN || 'http://localhost:3000';
  const configuredOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.header('Origin');
    if (!origin) {
      return next();
    }

    let isAllowed =
      configuredOrigins.includes(origin) ||
      configuredOrigins.includes('*') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');

    if (!isAllowed) {
      try {
        const parsed = new URL(origin);
        if (
          parsed.hostname.endsWith('.run.app') ||
          parsed.hostname.endsWith('.google.com') ||
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1'
        ) {
          isAllowed = true;
        }
      } catch {
        isAllowed = false;
      }
    }

    if (!isAllowed) {
      logger.warn(`[CORS Bloqueado] Tentativa de acesso de origem não autorizada: ${origin}`, {
        origin,
        path: req.originalUrl,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'CORS_FORBIDDEN',
          message: 'Origem de requisição não permitida pela política CORS.',
          status: 403,
        },
      });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-Id, Accept, Origin, User-Agent, Range',
    );
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id, Content-Range');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}
