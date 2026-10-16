import { Router } from 'express';
import { tasksController } from './tasks.controller.ts';

export const tasksRoutes = Router();

tasksRoutes.get('/tasks', tasksController.list);
tasksRoutes.post('/tasks', tasksController.create);
tasksRoutes.patch('/tasks/:id', tasksController.update);
tasksRoutes.post('/tasks/:id/approve', tasksController.approve);
tasksRoutes.delete('/tasks/:id', tasksController.delete);
