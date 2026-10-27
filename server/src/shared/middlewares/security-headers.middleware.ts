import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function createSecurityHeadersMiddleware() {
  const isDev = process.env.NODE_ENV !== 'production';

  const helmetMiddleware = helmet({
    contentSecurityPolicy: isDev ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', '*'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        connectSrc: [
          "'self'",
          'https://generativelanguage.googleapis.com',
          'https://*.run.app',
          'https://*.google.com',
          'ws:',
          'wss:',
          '*',
        ],
        objectSrc: ["'none'"],
        frameAncestors: ['*'],
        upgradeInsecureRequests: null,
      },
    },
    frameguard: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    dnsPrefetchControl: { allow: false },
    hidePoweredBy: true,
    hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: true },
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
