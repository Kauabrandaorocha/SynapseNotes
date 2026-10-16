import { db, Tag } from '../../infra/database/database-adapter.ts';

export class CategoriesRepository {
  public listByWorkspace(workspaceId: string): Tag[] {
    return db.listTags(workspaceId);
  }

  public getOrCreate(workspaceId: string, name: string): Tag {
    return db.getOrCreateTag(workspaceId, name);
  }

  public countNotesForTag(workspaceId: string, tagName: string): number {
    const lower = tagName.toLowerCase();
    return db.notes.filter(
      (n) =>
        n.workspaceId === workspaceId &&
        n.deletedAt === null &&
        n.tags.some((t) => t.name.toLowerCase() === lower),
    ).length;
  }

  public getDefaultWorkspace() {
    return db.getDefaultWorkspace();
  }
}

export const categoriesRepository = new CategoriesRepository();
