import { Router } from 'express';
import { audioController } from './audio.controller.ts';
import { authenticateJwt } from '../../shared/middlewares/auth.middleware.ts';

export const audioRoutes = Router();

// Endpoint oficial do módulo de áudio
audioRoutes.post('/audio/process', audioController.processAudio);

// Endpoint retrocompatível chamado pelo frontend em api.ts (/notes/audio)
audioRoutes.post('/notes/audio', audioController.processAudio);

// Rota protegida com JWT e verificação de propriedade para streaming de áudio privado
audioRoutes.get('/media/:fileKey', authenticateJwt, audioController.getAudioMedia);

// Rota protegida com JWT para obter o áudio de uma nota específica
audioRoutes.get('/notes/:id/audio', authenticateJwt, audioController.getNoteAudio);

