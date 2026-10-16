import { audioRepository, AudioRepository } from './audio.repository.ts';
import { CreateAudioNoteDTO } from './audio.types.ts';
import { audioTranscriber } from '../../infra/transcription/audio-transcriber.ts';
import { storageAdapter } from '../../infra/storage/storage-adapter.ts';
import { geminiAdapter } from '../../infra/llm/gemini-adapter.ts';
import { Note } from '../notes/notes.types.ts';
import { BadRequestError } from '../../shared/errors/app-error.ts';
import { db } from '../../infra/database/database-adapter.ts';

export class AudioService {
  constructor(private repo: AudioRepository = audioRepository) {}

  public async processAudioNote(dto: CreateAudioNoteDTO): Promise<Note> {
    if (!dto.audioData || typeof dto.audioData !== 'string') {
      throw new BadRequestError('Dados de áudio codificados em base64 são obrigatórios.');
    }

    const defaultWorkspace = this.repo.getDefaultWorkspace();
    const workspaceId = dto.workspaceId || defaultWorkspace.id;
    const userId = dto.userId || defaultWorkspace.ownerId;

    // Remove redundância: se não houver título, usa título limpo "Gravação de Voz" sem data
    const finalTitle = dto.title?.trim() || 'Gravação de Voz';

    const base64Data = dto.audioData.includes(',')
      ? dto.audioData.split(',')[1]
      : dto.audioData;
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const mimeType = dto.mimeType || 'audio/webm';
    const durationSeconds = dto.durationSeconds ? Math.round(dto.durationSeconds) : 0;

    let mediaUrl: string | null = null;
    try {
      const stored = await storageAdapter.upload(audioBuffer, 'voice-record.webm', mimeType);
      mediaUrl = stored.url;
    } catch {
      mediaUrl = null;
    }

    const initialTag = this.repo.getOrCreateTag(workspaceId, 'Áudio');
    const expires20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

    const createdNote = this.repo.createNote({
      workspaceId,
      userId,
      title: finalTitle,
      rawContent: 'Áudio capturado. Processando transcrição e síntese por inteligência artificial...',
      summary: null,
      transcription: null,
      sourceType: 'audio',
      sourceUrl: mediaUrl,
      hasAudio: true,
      mediaDurationSeconds: durationSeconds > 0 ? durationSeconds : null,
      mediaExpiresAt: expires20Days,
      complexityLevel: 'unprocessed',
      isProtected: false,
      processingStatus: 'processing',
      errorMessage: null,
      tags: [initialTag],
      tasksCount: 0,
    });

    // Processamento de áudio em background
    setImmediate(async () => {
      try {
        const { transcription, analysis } = await audioTranscriber.transcribe(
          audioBuffer,
          mimeType,
          finalTitle,
        );

        const mergedTagNames = Array.from(
          new Set(['Áudio', ...(analysis.tags || [])]),
        );
        const resolvedTags = mergedTagNames.map((name) =>
          this.repo.getOrCreateTag(workspaceId, name),
        );

        let createdTasksCount = 0;
        if (analysis.extractedTasks && analysis.extractedTasks.length > 0) {
          analysis.extractedTasks.forEach((et) => {
            db.createTask({
              noteId: createdNote.id,
              noteTitle: createdNote.title,
              workspaceId,
              userId,
              content: et.content,
              isCompleted: false,
              isSuggested: et.isSuggested ?? true,
              priorityBucket: et.priorityBucket || 'upcoming',
              dueDate: null,
            });
            createdTasksCount += 1;
          });
        }

        this.repo.updateNote(createdNote.id, {
          transcription,
          summary: analysis.summary,
          complexityLevel: analysis.complexityLevel,
          tags: resolvedTags,
          tasksCount: createdTasksCount,
          processingStatus: 'done',
        });

        const allNotes = db.listNotes(workspaceId);
        const updatedSelf = db.getNote(createdNote.id);
        if (updatedSelf) {
          const correlations = await geminiAdapter.findSynapticRelations(updatedSelf, allNotes);
          correlations.forEach((corr) => {
            const targetNote = db.getNote(corr.targetNoteId);
            if (targetNote) {
              db.createRelation({
                workspaceId,
                sourceNoteId: createdNote.id,
                targetNoteId: targetNote.id,
                targetNoteTitle: targetNote.title,
                similarityScore: corr.similarityScore,
                reason: corr.reason,
              });
            }
          });
        }
      } catch (err) {
        console.error('[AudioService] Erro no processamento assíncrono de áudio:', err);
        this.repo.updateNote(createdNote.id, {
          processingStatus: 'done',
          summary: 'Gravação de voz armazenada.',
          complexityLevel: 'low',
        });
      }
    });

    return createdNote;
  }
}

export const audioService = new AudioService();
