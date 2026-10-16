import { queueAdapter, QueueMessage } from '../infra/queue/queue-adapter.ts';
import { audioTranscriber } from '../infra/transcription/audio-transcriber.ts';
import { geminiAdapter } from '../infra/llm/gemini-adapter.ts';
import { db } from '../infra/database/database-adapter.ts';
import { logger } from '../shared/logger/logger.ts';

export class WorkerService {
  private isRunning = false;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('[WorkerService] Inicializando background worker de processamento assíncrono...');

    // Inscrição para tarefas assíncronas de áudio
    queueAdapter.subscribe('audio.transcribe', async (msg: QueueMessage) => {
      logger.info(`[Worker] Processando job de áudio: ${msg.id}`, { payload: msg.payload });
      const { noteId, audioBufferBase64, mimeType, titleHint } = msg.payload;

      const buffer = Buffer.from(audioBufferBase64, 'base64');
      const result = await audioTranscriber.transcribe(buffer, mimeType, titleHint);

      db.updateNote(noteId, {
        transcription: result.transcription,
        summary: result.analysis.summary,
        complexityLevel: result.analysis.complexityLevel,
        processingStatus: 'done',
      });
      logger.info(`[Worker] Job de áudio finalizado para nota: ${noteId}`);
    });

    // Inscrição para tarefas de correlação sináptica
    queueAdapter.subscribe('notes.correlate', async (msg: QueueMessage) => {
      logger.info(`[Worker] Processando correlações sinápticas: ${msg.id}`);
      const { noteId, workspaceId } = msg.payload;
      const note = db.getNote(noteId);
      if (!note) return;

      const allNotes = db.listNotes(workspaceId);
      const correlations = await geminiAdapter.findSynapticRelations(note, allNotes);
      correlations.forEach((corr) => {
        const target = db.getNote(corr.targetNoteId);
        if (target) {
          db.createRelation({
            workspaceId,
            sourceNoteId: note.id,
            targetNoteId: target.id,
            targetNoteTitle: target.title,
            similarityScore: corr.similarityScore,
            reason: corr.reason,
          });
        }
      });
    });

    logger.info('[WorkerService] Worker pronto para processar mensagens da fila.');
  }

  public stop(): void {
    this.isRunning = false;
    logger.info('[WorkerService] Background worker finalizado.');
  }
}

export const workerService = new WorkerService();
