import { db, Note, NoteFilter, Tag } from '../../infra/database/database-adapter.ts';

export class NotesRepository {
  public findById(id: string): Note | undefined {
    return db.getNote(id);
  }

  public listByWorkspace(workspaceId: string, filter?: NoteFilter): Note[] {
    return db.listNotes(workspaceId, filter);
  }

  public create(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Note {
    return db.createNote(noteData);
  }

  public update(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'deletedAt'>>): Note | undefined {
    return db.updateNote(id, updates);
  }

  public delete(id: string): boolean {
    return db.deleteNote(id);
  }

  public getOrCreateTag(workspaceId: string, name: string): Tag {
    return db.getOrCreateTag(workspaceId, name);
  }

  public getRelationsForNote(noteId: string) {
    return db.getRelationsForNote(noteId);
  }

  public createRelation(relation: {
    workspaceId: string;
    sourceNoteId: string;
    targetNoteId: string;
    targetNoteTitle: string;
    similarityScore: number;
    reason: string;
  }) {
    return db.createRelation(relation);
  }

  public getDefaultWorkspace() {
    return db.getDefaultWorkspace();
  }
}

export const notesRepository = new NotesRepository();
