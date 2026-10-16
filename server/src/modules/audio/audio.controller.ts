import { Request, Response, NextFunction } from 'express';
import { audioService, AudioService } from './audio.service.ts';

export class AudioController {
  constructor(private service: AudioService = audioService) {}

  public processAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await this.service.processAudioNote(req.body);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  };
}

export const audioController = new AudioController();
