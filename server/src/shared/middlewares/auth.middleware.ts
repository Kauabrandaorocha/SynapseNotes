import { Request, Response, NextFunction } from 'express';
import { JwtUtil, JwtPayload } from '../utils/jwt.ts';
import { AUTH_COOKIE_NAME } from '../utils/cookie.ts';
import { UnauthorizedError } from '../errors/app-error.ts';
import { db } from '../../infra/database/database-adapter.ts';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName?: string;
        role?: string;
      };
    }
  }
}

/**
 * Extrai o token JWT priorizando o cookie seguro HttpOnly ('accessToken').
 * Caso não haja cookie (ex: requisições CLI, curl ou Swagger), aceita cabeçalho Bearer.
 */
function extractToken(req: Request): string | null {
  // 1. Prioridade: Cookie seguro HttpOnly
  if (req.cookies && typeof req.cookies[AUTH_COOKIE_NAME] === 'string' && req.cookies[AUTH_COOKIE_NAME].trim().length > 0) {
    return req.cookies[AUTH_COOKIE_NAME].trim();
  }

  // 2. Fallback: Cabeçalho Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }

  return null;
}

export function authenticateJwt(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    throw new UnauthorizedError('Acesso não autorizado: Sessão não autenticada. Cookie seguro ou credencial não fornecido.');
  }

  const payload: JwtPayload = JwtUtil.verify(token);

  // Validação no banco de dados em memória
  const user = db.users.find((u) => u.id === payload.userId || u.email.toLowerCase() === payload.email.toLowerCase());
  if (!user) {
    throw new UnauthorizedError('Acesso não autorizado: Usuário não cadastrado ou inativo.');
  }

  req.user = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: payload.role || 'user',
  };

  next();
}

export function optionalAuthenticateJwt(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = JwtUtil.verify(token);
    const user = db.users.find((u) => u.id === payload.userId || u.email.toLowerCase() === payload.email.toLowerCase());
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: payload.role || 'user',
      };
    }
  } catch {
    // Ignora se for opcional
  }

  next();
}
