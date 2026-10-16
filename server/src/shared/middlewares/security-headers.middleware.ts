import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function createSecurityHeadersMiddleware() {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        connectSrc: [
          "'self'",
          'https://generativelanguage.googleapis.com',
          'https://*.run.app',
          'ws:',
          'wss:',
        ],
        objectSrc: ["'none'"],
        frameAncestors: [
          "'self'",
          'https://*.google.com',
          'https://*.run.app',
          'http://localhost:*',
          'http://127.0.0.1:*',
        ],
        upgradeInsecureRequests: null,
      },
    },
    frameguard: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
    helmetMiddleware(req, res, next);
  };
}
