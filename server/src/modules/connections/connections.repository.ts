import { db, NoteRelation, Note } from '../../infra/database/database-adapter.ts';

export class ConnectionsRepository {
  public listByWorkspace(workspaceId: string): NoteRelation[] {
    return db.listRelations(workspaceId);
  }

  public getForNote(noteId: string): NoteRelation[] {
    return db.getRelationsForNote(noteId);
  }

  public create(relation: Omit<NoteRelation, 'id' | 'createdAt'>): NoteRelation {
    return db.createRelation(relation);
  }

  public findNote(noteId: string): Note | undefined {
    return db.getNote(noteId);
  }

  public listNotes(workspaceId: string): Note[] {
    return db.listNotes(workspaceId);
  }

  public getDefaultWorkspace() {
    return db.getDefaultWorkspace();
  }
}

export const connectionsRepository = new ConnectionsRepository();
