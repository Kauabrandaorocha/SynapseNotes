import { Router } from 'express';
import { connectionsController } from './connections.controller.ts';

export const connectionsRoutes = Router();

connectionsRoutes.get('/connections', connectionsController.list);
connectionsRoutes.get('/connections/graph', connectionsController.getGraph);
connectionsRoutes.get('/connections/note/:noteId', connectionsController.getForNote);
connectionsRoutes.post('/connections', connectionsController.create);
connectionsRoutes.post('/connections/discover/:noteId', connectionsController.discover);

// Endpoints retrocompatíveis de relations
connectionsRoutes.get('/relations', connectionsController.list);
connectionsRoutes.get('/relations/:noteId', connectionsController.getForNote);
