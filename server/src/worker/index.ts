import { workerService } from './worker.service.ts';
import { logger } from '../shared/logger/logger.ts';

async function bootstrapWorker() {
  logger.info('[SynapseNotes Worker Process] Iniciando processo dedicado do worker...');
  workerService.start();

  const shutdown = () => {
    logger.info('[SynapseNotes Worker Process] Encerrando com segurança...');
    workerService.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (process.argv[1]?.endsWith('worker/index.ts') || process.env.RUN_WORKER_STANDALONE === 'true') {
  bootstrapWorker().catch((err) => {
    logger.error('[Worker Fatal Error]:', { error: err });
    process.exit(1);
  });
}

export * from './worker.service.ts';
