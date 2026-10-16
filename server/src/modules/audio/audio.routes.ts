import { Router } from 'express';
import { audioController } from './audio.controller.ts';

export const audioRoutes = Router();

// Endpoint oficial do módulo de áudio
audioRoutes.post('/audio/process', audioController.processAudio);

// Endpoint retrocompatível chamado pelo frontend em api.ts (/notes/audio)
audioRoutes.post('/notes/audio', audioController.processAudio);
