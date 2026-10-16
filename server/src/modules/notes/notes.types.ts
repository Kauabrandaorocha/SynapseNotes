import { Note, NoteFilter, Tag } from '../../infra/database/database-adapter.ts';

export type { Note, NoteFilter, Tag };

export interface CreateNoteDTO {
  workspaceId?: string;
  userId?: string;
  title: string;
  content?: string;
  sourceType?: 'text' | 'link' | 'audio';
  sourceUrl?: string;
  isProtected?: boolean;
  tagNames?: string[];
}

export interface UpdateNoteDTO {
  title?: string;
  rawContent?: string;
  summary?: string;
  sourceUrl?: string;
  isProtected?: boolean;
  tagNames?: string[];
}

export interface NoteWithRelations {
  note: Note;
  relations: Array<{
    id: string;
    targetNoteId: string;
    targetNoteTitle: string;
    similarityScore: number;
    reason: string;
    createdAt: string;
  }>;
}
