import { db, Note, Tag } from '../../infra/database/database-adapter.ts';

export class AudioRepository {
  public createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Note {
    return db.createNote(noteData);
  }

  public updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'deletedAt'>>): Note | undefined {
    return db.updateNote(id, updates);
  }

  public getOrCreateTag(workspaceId: string, name: string): Tag {
    return db.getOrCreateTag(workspaceId, name);
  }

  public getDefaultWorkspace() {
    return db.getDefaultWorkspace();
  }
}

export const audioRepository = new AudioRepository();
