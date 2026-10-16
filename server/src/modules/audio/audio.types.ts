import { Note } from '../notes/notes.types.ts';

export interface CreateAudioNoteDTO {
  title?: string;
  audioData: string;
  mimeType?: string;
  durationSeconds?: number;
  workspaceId?: string;
  userId?: string;
}

export interface AudioProcessingResult {
  note: Note;
  mediaUrl?: string;
}
