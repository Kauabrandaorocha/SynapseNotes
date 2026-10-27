import { Router } from 'express';
import { authController } from './auth.controller.ts';

export const authRoutes = Router();

authRoutes.post('/auth/register', authController.register);
authRoutes.post('/auth/login', authController.login);
authRoutes.get('/auth/me', authController.getMe);
authRoutes.get('/auth/session', authController.getSession);
authRoutes.post('/auth/logout', authController.logout);
