import { Router } from 'express';
import { categoriesController } from './categories.controller.ts';

export const categoriesRoutes = Router();

// Endpoints REST de categorias
categoriesRoutes.get('/categories', categoriesController.list);
categoriesRoutes.post('/categories', categoriesController.create);

// Endpoints retrocompatíveis de tags
categoriesRoutes.get('/tags', categoriesController.list);
categoriesRoutes.post('/tags', categoriesController.create);
