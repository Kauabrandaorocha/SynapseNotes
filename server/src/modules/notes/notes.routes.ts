import { Router } from 'express';
import { notesController } from './notes.controller.ts';

export const notesRoutes = Router();

notesRoutes.get('/notes', notesController.list);
notesRoutes.get('/notes/:id', notesController.getById);
notesRoutes.post('/notes', notesController.create);
notesRoutes.patch('/notes/:id', notesController.update);
notesRoutes.delete('/notes/:id', notesController.delete);
