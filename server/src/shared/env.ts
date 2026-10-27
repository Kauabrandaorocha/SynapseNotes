import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

function parseSafeInt(val: unknown, fallback: number): number {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  if (str === '' || str === 'null' || str === 'undefined') return fallback;
  const num = parseInt(str, 10);
  return isNaN(num) ? fallback : num;
}

export const envSchema = z.object({
  // ===== Aplicação =====
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .optional()
    .default('3333')
    .transform((val) => parseSafeInt(val, 3333))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'PORT deve ser um número inteiro válido entre 1 e 65535.',
    }),
  CORS_ORIGIN: z
    .string()
    .min(1, 'CORS_ORIGIN é obrigatório.')
    .default('http://localhost:5173'),

  // ===== Banco (PostgreSQL no docker-compose) =====
  POSTGRES_USER: z
    .string()
    .min(1, 'POSTGRES_USER é obrigatório.')
    .default('notes'),
  POSTGRES_PASSWORD: z
    .string()
    .min(1, 'POSTGRES_PASSWORD é obrigatório.')
    .default('troque_esta_senha_forte'),
  POSTGRES_DB: z
    .string()
    .min(1, 'POSTGRES_DB é obrigatório.')
    .default('notes_db'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL é obrigatória.')
    .refine(
      (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      {
        message: 'DATABASE_URL deve ser uma connection string PostgreSQL válida.',
      },
    )
    .default('postgresql://notes:troque_esta_senha_forte@localhost:5432/notes_db'),

  // ===== JWT =====
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET deve ter no mínimo 32 caracteres (recomendado 64 chars).')
    .default('default-jwt-access-secret-min-32-chars-long-synapsenotes'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres (recomendado 64 chars).')
    .default('default-jwt-refresh-secret-min-32-chars-long-synapsenotes'),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .min(1, 'JWT_ACCESS_EXPIRES_IN é obrigatório.')
    .default('15m'),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .min(1, 'JWT_REFRESH_EXPIRES_IN é obrigatório.')
    .default('7d'),

  // ===== AWS =====
  AWS_REGION: z
    .string()
    .min(1, 'AWS_REGION é obrigatória.')
    .default('sa-east-1'),
  AWS_ACCESS_KEY_ID: z
    .string()
    .optional()
    .default(''),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional()
    .default(''),
  S3_BUCKET_NAME: z
    .string()
    .optional()
    .default(''),
  S3_PRESIGNED_URL_EXPIRES_IN: z
    .string()
    .optional()
    .default('300')
    .transform((val) => parseSafeInt(val, 300))
    .refine((val) => val > 0, {
      message: 'S3_PRESIGNED_URL_EXPIRES_IN deve ser um número positivo de segundos.',
    }),
  SQS_QUEUE_URL: z
    .string()
    .optional()
    .default(''),
  SQS_DLQ_URL: z
    .string()
    .optional()
    .default(''),
  AWS_ENDPOINT_URL: z
    .string()
    .optional()
    .default('http://localhost:4566'),
  LOCAL_STORAGE_PATH: z
    .string()
    .optional()
    .default('./uploads'),

  // ===== Limites de upload de áudio =====
  AUDIO_MAX_SIZE_MB: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseSafeInt(val, 10))
    .refine((val) => val > 0, {
      message: 'AUDIO_MAX_SIZE_MB deve ser um número positivo em megabytes.',
    }),
  AUDIO_MAX_DURATION_SECONDS: z
    .string()
    .optional()
    .default('300')
    .transform((val) => parseSafeInt(val, 300))
    .refine((val) => val > 0, {
      message: 'AUDIO_MAX_DURATION_SECONDS deve ser um número positivo em segundos.',
    }),

  // ===== IA (Gemini) =====
  GEMINI_API_KEY: z
    .string()
    .optional(),
  GEMINI_MODEL: z
    .string()
    .min(1, 'GEMINI_MODEL é obrigatório.')
    .default('gemini-3.5-flash'),
  LLM_DAILY_QUOTA_PER_USER: z
    .string()
    .optional()
    .default('50')
    .transform((val) => parseSafeInt(val, 50))
    .refine((val) => val > 0, {
      message: 'LLM_DAILY_QUOTA_PER_USER deve ser um número positivo.',
    }),

  // ===== Worker =====
  WORKER_CONCURRENCY: z
    .string()
    .optional()
    .default('2')
    .transform((val) => parseSafeInt(val, 2))
    .refine((val) => val >= 1, {
      message: 'WORKER_CONCURRENCY deve ser no mínimo 1.',
    }),
  WORKER_MAX_RETRIES: z
    .string()
    .optional()
    .default('3')
    .transform((val) => parseSafeInt(val, 3))
    .refine((val) => val >= 0, {
      message: 'WORKER_MAX_RETRIES deve ser um número igual ou maior que zero.',
    }),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(customEnv: Record<string, any> = process.env): EnvConfig {
  const result = envSchema.safeParse(customEnv);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue: any) => ({
      caminho: issue.path.join('.'),
      mensagem: issue.message,
    }));

    console.error('====================================================');
    console.error('❌ ERRO CRÍTICO NA VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE:');
    formattedErrors.forEach((err: any) => {
      console.error(` - [${err.caminho}]: ${err.mensagem}`);
    });
    console.error('====================================================');

    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error('Falha na validação das variáveis de ambiente');
  }

  return result.data;
}

export const env = validateEnv();
