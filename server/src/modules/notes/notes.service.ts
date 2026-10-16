import { notesRepository, NotesRepository } from './notes.repository.ts';
import { geminiAdapter } from '../../infra/llm/gemini-adapter.ts';
import { CreateNoteDTO, Note, NoteFilter, NoteWithRelations, UpdateNoteDTO } from './notes.types.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.ts';
import { db } from '../../infra/database/database-adapter.ts';

export class NotesService {
  constructor(private repo: NotesRepository = notesRepository) {}

  public async listNotes(workspaceId?: string, filter?: NoteFilter): Promise<Note[]> {
    const wsId = workspaceId || this.repo.getDefaultWorkspace().id;
    return this.repo.listByWorkspace(wsId, filter);
  }

  public async getNoteWithRelations(id: string): Promise<NoteWithRelations> {
    const note = this.repo.findById(id);
    if (!note) {
      throw new NotFoundError('Nota não encontrada.');
    }

    const relations = this.repo.getRelationsForNote(note.id);
    return { note, relations };
  }

  public async createNote(dto: CreateNoteDTO): Promise<Note> {
    if (!dto.title || typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestError('Título da nota é obrigatório.');
    }

    const defaultWorkspace = this.repo.getDefaultWorkspace();
    const workspaceId = dto.workspaceId || defaultWorkspace.id;
    const userId = dto.userId || defaultWorkspace.ownerId;
    const rawText = dto.content || dto.sourceUrl || '';

    const initialTags = (dto.tagNames || []).map((name) =>
      this.repo.getOrCreateTag(workspaceId, name),
    );

    const createdNote = this.repo.create({
      workspaceId,
      userId,
      title: dto.title.trim(),
      rawContent: rawText,
      summary: null,
      transcription: null,
      sourceType: dto.sourceType || 'text',
      sourceUrl: dto.sourceUrl || null,
      hasAudio: false,
      mediaDurationSeconds: null,
      mediaExpiresAt: null,
      complexityLevel: 'unprocessed',
      isProtected: dto.isProtected ?? false,
      processingStatus: 'processing',
      errorMessage: null,
      tags: initialTags,
      tasksCount: 0,
    });

    // Análise assíncrona com IA em background
    setImmediate(async () => {
      try {
        const analysis = await geminiAdapter.analyzeTextNote(createdNote.title, rawText);

        const mergedTagNames = Array.from(
          new Set([...initialTags.map((t) => t.name), ...(analysis.tags || [])]),
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

        this.repo.update(createdNote.id, {
          summary: analysis.summary,
          complexityLevel: analysis.complexityLevel,
          tags: resolvedTags,
          tasksCount: createdTasksCount,
          processingStatus: 'done',
        });

        const allWorkspaceNotes = this.repo.listByWorkspace(workspaceId);
        const updatedSelf = this.repo.findById(createdNote.id);
        if (updatedSelf) {
          const correlations = await geminiAdapter.findSynapticRelations(
            updatedSelf,
            allWorkspaceNotes,
          );
          correlations.forEach((corr) => {
            const targetNote = this.repo.findById(corr.targetNoteId);
            if (targetNote) {
              this.repo.createRelation({
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
        console.error('[NotesService] Erro no processamento assíncrono da nota:', err);
        this.repo.update(createdNote.id, {
          processingStatus: 'done',
          summary: 'Síntese preliminar processada.',
          complexityLevel: 'low',
        });
      }
    });

    return createdNote;
  }

  public async updateNote(id: string, dto: UpdateNoteDTO): Promise<Note> {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Nota não encontrada.');
    }

    const updates: Partial<Note> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.rawContent !== undefined) updates.rawContent = dto.rawContent;
    if (dto.summary !== undefined) updates.summary = dto.summary;
    if (dto.sourceUrl !== undefined) updates.sourceUrl = dto.sourceUrl;
    if (dto.isProtected !== undefined) updates.isProtected = dto.isProtected;

    if (dto.tagNames) {
      updates.tags = dto.tagNames.map((name) =>
        this.repo.getOrCreateTag(existing.workspaceId, name),
      );
    }

    const updated = this.repo.update(id, updates);
    if (!updated) {
      throw new NotFoundError('Nota não encontrada para atualização.');
    }
    return updated;
  }

  public async deleteNote(id: string): Promise<boolean> {
    const deleted = this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Nota não encontrada para exclusão.');
    }
    return true;
  }
}

export const notesService = new NotesService();
