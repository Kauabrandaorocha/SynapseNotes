import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from '../shared/middlewares/request-id.middleware.ts';
import { createSecurityHeadersMiddleware } from '../shared/middlewares/security-headers.middleware.ts';
import { createCorsMiddleware } from '../shared/middlewares/cors.middleware.ts';
import { globalRateLimiter } from '../shared/middlewares/rate-limiter.middleware.ts';
import { errorHandlerMiddleware } from '../shared/middlewares/error-handler.middleware.ts';
import { NotFoundError } from '../shared/errors/app-error.ts';

// Módulos da nova arquitetura
import { authRoutes } from '../modules/auth/index.ts';
import { notesRoutes } from '../modules/notes/index.ts';
import { audioRoutes } from '../modules/audio/index.ts';
import { tasksRoutes } from '../modules/tasks/index.ts';
import { categoriesRoutes } from '../modules/categories/index.ts';
import { connectionsRoutes } from '../modules/connections/index.ts';

// Repositório / banco para rotas auxiliares
import { db } from '../infra/database/database-adapter.ts';

export interface AppOptions {
  enableRateLimiting?: boolean;
}

export function createExpressApp(options: AppOptions = {}): Express {
  const { enableRateLimiting = true } = options;
  const app = express();

  app.use(requestIdMiddleware);
  app.use(createSecurityHeadersMiddleware());
  app.use(createCorsMiddleware());
  app.use(cookieParser());

  if (enableRateLimiting) {
    app.use(globalRateLimiter.middleware());
  }

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Health-check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  });

  // Rotas de Workspaces
  app.get('/api/workspaces', (_req: Request, res: Response) => {
    const workspaces = db.listWorkspaces();
    res.json({ success: true, data: workspaces });
  });

  app.get('/api/workspaces/current', (_req: Request, res: Response) => {
    const current = db.getDefaultWorkspace();
    res.json({ success: true, data: current });
  });

  // Rotas de Privacidade e Governança LGPD
  app.get('/api/privacy/export', (_req: Request, res: Response) => {
    const defaultUser = db.getDefaultWorkspace().ownerId;
    const exported = db.exportData(defaultUser);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="synapsenotes-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    return res.json(exported);
  });

  app.post('/api/privacy/consent', (req: Request, res: Response) => {
    const { termVersion = 'v1.0' } = req.body;
    const defaultUser = db.getDefaultWorkspace().ownerId;
    db.recordConsent(defaultUser, termVersion);
    return res.status(201).json({
      success: true,
      data: {
        message: 'Consentimento de processamento registrado com sucesso.',
        acceptedAt: new Date().toISOString(),
      },
    });
  });

  app.delete('/api/privacy/hard-delete', (req: Request, res: Response) => {
    const { confirmEmail } = req.body;
    const defaultUser = db.getDefaultWorkspace().ownerId;
    if (!confirmEmail || typeof confirmEmail !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'É obrigatório digitar o e-mail cadastrado para confirmar a exclusão.',
          status: 400,
        },
      });
    }
    db.hardDeleteAccount(defaultUser);
    return res.json({
      success: true,
      data: {
        message: 'Todos os seus dados, notas, áudios e vetores foram destruídos permanentemente.',
        deletedAt: new Date().toISOString(),
      },
    });
  });

  // Montagem dos 6 módulos arquiteturais no prefixo /api
  app.use('/api', authRoutes);
  app.use('/api', notesRoutes);
  app.use('/api', audioRoutes);
  app.use('/api', tasksRoutes);
  app.use('/api', categoriesRoutes);
  app.use('/api', connectionsRoutes);

  // Endpoint de teste de erro para ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/test-internal-error', () => {
      throw new Error('Falha simulada para verificação de error handler');
    });
  }

  // 404 para rotas não mapeadas sob /api
  app.use('/api', (req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}' não foi encontrado.`));
  });

  // Handler universal de erros
  app.use(errorHandlerMiddleware);

  return app;
}
