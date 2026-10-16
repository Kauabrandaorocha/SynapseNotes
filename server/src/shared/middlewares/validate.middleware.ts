import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationSchemas {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errorDetails: ValidationErrorDetail[] = [];

    if (schemas.body) {
      const result = await schemas.body.safeParseAsync(req.body);
      if (!result.success) {
        collectZodErrors(result.error, 'body', errorDetails);
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = await schemas.query.safeParseAsync(req.query);
      if (!result.success) {
        collectZodErrors(result.error, 'query', errorDetails);
      } else {
        req.query = result.data;
      }
    }

    if (schemas.params) {
      const result = await schemas.params.safeParseAsync(req.params);
      if (!result.success) {
        collectZodErrors(result.error, 'params', errorDetails);
      } else {
        req.params = result.data;
      }
    }

    if (errorDetails.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados fornecidos são inválidos.',
          status: 400,
          details: errorDetails,
          correlationId: (req as any).id,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

function collectZodErrors(
  error: ZodError,
  source: 'body' | 'query' | 'params',
  target: ValidationErrorDetail[],
): void {
  for (const issue of error.issues) {
    const fieldPath = issue.path.join('.');
    target.push({
      field: fieldPath ? `${source}.${fieldPath}` : source,
      message: issue.message,
      code: issue.code,
    });
  }
}
