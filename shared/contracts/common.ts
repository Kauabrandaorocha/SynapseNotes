import { z } from 'zod';

export const PaginationQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(1000)),
    limit: z
      .string()
      .optional()
      .default('20')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100)),
    search: z.string().min(1).max(100).optional(),
    sort: z.string().min(1).max(50).optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const PaginationMetaSchema = z
  .object({
    page: z.number().int().min(1).max(1000),
    limit: z.number().int().min(1).max(100),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  })
  .strict();

export const ApiErrorCodeEnum = z.enum([
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNPROCESSABLE_ENTITY',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
]);

export const ApiErrorDetailSchema = z
  .object({
    field: z.string().min(1).max(100).optional(),
    message: z.string().min(1).max(500),
    code: z.string().min(1).max(50).optional(),
  })
  .strict();

export const ApiErrorPayloadSchema = z
  .object({
    code: ApiErrorCodeEnum,
    message: z.string().min(1).max(500),
    status: z.number().int().min(400).max(599),
    details: z.array(ApiErrorDetailSchema).max(50).optional(),
    correlationId: z.string().min(1).max(128).optional(),
    timestamp: z.string().datetime(),
  })
  .strict();

export const ApiFailureResponseSchema = z
  .object({
    success: z.literal(false),
    error: ApiErrorPayloadSchema,
  })
  .strict();

export function createSuccessResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z
    .object({
      success: z.literal(true),
      data: dataSchema,
      meta: z.record(z.string().max(50), z.unknown()).optional(),
    })
    .strict();
}

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z
    .object({
      success: z.literal(true),
      data: z.array(itemSchema).max(100),
      pagination: PaginationMetaSchema,
    })
    .strict();
}

export const StrictEmailSchema = z
  .string()
  .email('Formato de e-mail inválido')
  .trim()
  .toLowerCase()
  .min(5, 'E-mail deve ter no mínimo 5 caracteres')
  .max(255, 'E-mail não pode exceder 255 caracteres')
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'E-mail deve conter domínio e extensão válidos (ex.: .com, .com.br, .edu)',
  );
