import { Tag } from '../../infra/database/database-adapter.ts';

export type Category = Tag;

export interface CreateCategoryDTO {
  workspaceId?: string;
  name: string;
}

export interface CategoryWithCount extends Category {
  notesCount: number;
}
