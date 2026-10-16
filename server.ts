import { createExpressApp } from './server/src/main/app.ts';
import { env } from './server/src/shared/config/env.ts';

async function bootstrap() {
  const app = createExpressApp();

  const portArgIndex = process.argv.indexOf('--port');
  const cliPort =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : undefined;

  const port =
    cliPort || (process.env.NODE_ENV === 'production' ? Number(process.env.PORT) || env.PORT || 8080 : 3000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const express = (await import('express')).default;
    const path = (await import('path')).default;
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.info(`[SynapseNotes Server] Inicializado com sucesso na porta ${port}`);
    console.info(`[Health-Check Endpoint] http://localhost:${port}/api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap Fatal Error]:', err);
  process.exit(1);
});
