import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/logger.ts';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class InMemoryRateLimiter {
  public windowMs: number;
  public maxRequests: number;
  public limiterName: string;
  public records: Map<string, RateLimitRecord>;

  constructor(windowMs: number, maxRequests: number, limiterName = 'global') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.limiterName = limiterName;
    this.records = new Map();
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip =
        req.ip ||
        (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const key = `${this.limiterName}:${ip}`;
      const now = Date.now();
      let record = this.records.get(key);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.records.set(key, record);
      } else {
        record.count += 1;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.count > this.maxRequests) {
        logger.warn(`[Rate Limit Excedido] IP ${ip} atingiu o limite de ${this.maxRequests} reqs`, {
          ip,
          limiter: this.limiterName,
          path: req.originalUrl,
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Muitas requisições. Por favor, aguarde ${resetSeconds} segundos antes de tentar novamente.`,
            status: 429,
            retryAfterSeconds: resetSeconds,
          },
        });
        return;
      }

      next();
    };
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }
}

export const globalRateLimiter = new InMemoryRateLimiter(60 * 1000, 300, 'global');
export const audioUploadRateLimiter = new InMemoryRateLimiter(60 * 1000, 30, 'audio-upload');
export const aiAnalysisRateLimiter = new InMemoryRateLimiter(60 * 1000, 45, 'ai-analysis');
