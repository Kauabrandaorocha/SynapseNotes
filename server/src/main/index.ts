import { createExpressApp } from './app.ts';
import { env } from '../shared/config/env.ts';
import { logger } from '../shared/logger/logger.ts';

export async function startServer() {
  const app = createExpressApp();
  const port = env.PORT || 3000;

  app.listen(port, '0.0.0.0', () => {
    logger.info(`[SynapseNotes Server] Inicializado na porta ${port}`);
    logger.info(`[Health-Check Endpoint] http://localhost:${port}/api/health`);
  });

  return app;
}

if (process.argv[1]?.endsWith('main/index.ts') || process.env.RUN_STANDALONE === 'true') {
  startServer().catch((err) => {
    logger.error('[Main Bootstrap Error]:', { error: err });
    process.exit(1);
  });
}

export * from './app.ts';
