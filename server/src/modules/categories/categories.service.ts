import { categoriesRepository, CategoriesRepository } from './categories.repository.ts';
import { Category, CategoryWithCount, CreateCategoryDTO } from './categories.types.ts';
import { BadRequestError } from '../../shared/errors/app-error.ts';

export class CategoriesService {
  constructor(private repo: CategoriesRepository = categoriesRepository) {}

  public async listCategories(workspaceId?: string): Promise<CategoryWithCount[]> {
    const wsId = workspaceId || this.repo.getDefaultWorkspace().id;
    const tags = this.repo.listByWorkspace(wsId);

    return tags.map((t) => ({
      ...t,
      notesCount: this.repo.countNotesForTag(wsId, t.name),
    }));
  }

  public async createCategory(dto: CreateCategoryDTO): Promise<Category> {
    if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestError('Nome da categoria/tag é obrigatório.');
    }

    const cleanName = dto.name.replace(/^#+/, '').trim();
    const wsId = dto.workspaceId || this.repo.getDefaultWorkspace().id;

    return this.repo.getOrCreate(wsId, cleanName);
  }
}

export const categoriesService = new CategoriesService();
