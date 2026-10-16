import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z
      .string()
      .optional()
      .default('3000')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
        message: 'PORT deve ser um número válido entre 1 e 65535',
      }),
    APP_URL: z.string().url().default('http://localhost:3000'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    DATABASE_URL: z
      .string()
      .default('postgresql://postgres:postgres@localhost:5432/synapsenotes'),
    JWT_SECRET_ACESS_TOKEN: z
      .string()
      .default('default-jwt-secret-for-synapsenotes-min-32-chars-long!'),
    JWT_SECRET_REFRESH_TOKEN: z
      .string()
      .default('default-refresh-token-secret-synapsenotes-min-32-chars!'),
    JWT_ACESS_TOKEN_EXPIRES_IN: z.string().default('10m'),
    JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    LOCAL_STORAGE_PATH: z.string().default('./uploads'),
    GEMINI_API_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    S3_BUCKET_NAME: z.string().optional(),
    SQS_QUEUE_URL: z.string().optional(),
    SQS_DLQ_URL: z.string().optional(),
    DAILY_AUDIO_LIMIT_MINUTES: z
      .string()
      .optional()
      .default('30')
      .transform((val) => parseInt(val, 10)),
    DAILY_NOTE_LIMIT_COUNT: z
      .string()
      .optional()
      .default('20')
      .transform((val) => parseInt(val, 10)),
  })
  .superRefine((data, ctx) => {
    if (data.STORAGE_DRIVER === 's3' && !data.S3_BUCKET_NAME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S3_BUCKET_NAME'],
        message: 'S3_BUCKET_NAME é obrigatório quando STORAGE_DRIVER está definido como "s3"',
      });
    }
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
