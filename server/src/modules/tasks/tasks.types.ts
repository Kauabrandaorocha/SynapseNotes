import { Task } from '../../infra/database/database-adapter.ts';

export type { Task };

export interface CreateTaskDTO {
  workspaceId?: string;
  userId?: string;
  noteId?: string;
  content: string;
  priorityBucket?: 'focus_today' | 'upcoming' | 'someday';
  dueDate?: string | null;
}

export interface UpdateTaskDTO {
  content?: string;
  isCompleted?: boolean;
  priorityBucket?: 'focus_today' | 'upcoming' | 'someday';
  dueDate?: string | null;
}
