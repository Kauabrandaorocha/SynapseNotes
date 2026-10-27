import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { audioService, AudioService } from './audio.service.ts';
import { storageAdapter } from '../../infra/storage/storage-adapter.ts';
import { db } from '../../infra/database/database-adapter.ts';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/app-error.ts';

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

  /**
   * Recuperação segura de arquivo de áudio privado por fileKey.
   * Exige autenticação JWT e valida que o usuário requisitante é o proprietário da nota.
   */
  public getAudioMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileKey } = req.params;
      if (!fileKey || fileKey.includes('..') || fileKey.includes('/') || fileKey.includes('\\')) {
        throw new BadRequestError('Identificador de arquivo de áudio inválido.');
      }

      // Validação de Usuário Autenticado
      const currentUser = req.user;
      if (!currentUser) {
        throw new ForbiddenError('Acesso não autorizado: Usuário não identificado.');
      }

      // Encontra a nota proprietária deste arquivo no banco
      const note = db.notes.find((n) => {
        if (!n.sourceUrl) return false;
        const normalized = n.sourceUrl.replace(/\\/g, '/');
        return normalized.includes(fileKey) || path.basename(normalized) === fileKey;
      });

      if (!note) {
        throw new NotFoundError('Arquivo de áudio não encontrado ou não associado a uma nota válida.');
      }

      // OWNERSHIP CHECK: Somente o proprietário da nota ou Administrador do sistema pode ouvir o áudio
      const isOwner = note.userId === currentUser.id;
      const isAdmin = currentUser.email === 'admin@synapsenotes.com' || currentUser.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError(
          'Acesso negado: Você não possui autorização para reproduzir esta gravação de áudio privada.',
        );
      }

      // Validação física do arquivo no armazenamento seguro
      const filePath = storageAdapter.getFilePath(fileKey);
      if (!filePath || !fs.existsSync(filePath)) {
        throw new NotFoundError('O arquivo físico de mídia não foi encontrado no servidor.');
      }

      this.streamAudioFile(req, res, filePath, fileKey);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Recuperação segura de áudio diretamente pelo ID da nota (/notes/:id/audio)
   */
  public getNoteAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const note = db.getNote(id);
      if (!note) {
        throw new NotFoundError('Nota não encontrada.');
      }

      if (!note.hasAudio || !note.sourceUrl) {
        throw new NotFoundError('Esta nota não possui gravação de áudio anexada.');
      }

      const currentUser = req.user;
      if (!currentUser) {
        throw new ForbiddenError('Acesso não autorizado: Usuário não identificado.');
      }

      // OWNERSHIP CHECK
      const isOwner = note.userId === currentUser.id;
      const isAdmin = currentUser.email === 'admin@synapsenotes.com' || currentUser.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError(
          'Acesso negado: Você não possui permissão para acessar o áudio privado desta nota.',
        );
      }

      const fileKey = path.basename(note.sourceUrl);
      const filePath = storageAdapter.getFilePath(fileKey);
      if (!filePath || !fs.existsSync(filePath)) {
        throw new NotFoundError('O arquivo de áudio solicitado não foi localizado no armazenamento.');
      }

      this.streamAudioFile(req, res, filePath, fileKey);
    } catch (error) {
      next(error);
    }
  };

  private streamAudioFile(req: Request, res: Response, filePath: string, fileKey: string): void {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(fileKey).toLowerCase();
    const mimeType =
      ext === '.mp3'
        ? 'audio/mp3'
        : ext === '.wav'
        ? 'audio/wav'
        : ext === '.ogg'
        ? 'audio/ogg'
        : ext === '.m4a'
        ? 'audio/mp4'
        : 'audio/webm';

    // Headers de segurança: nunca expõe rotas internas, impede cache público
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);
      fileStream.pipe(res);
    } else {
      res.status(200);
      res.setHeader('Content-Length', fileSize);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}

export const audioController = new AudioController();

