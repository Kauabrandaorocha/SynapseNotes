import { tasksRepository, TasksRepository } from './tasks.repository.ts';
import { CreateTaskDTO, Task, UpdateTaskDTO } from './tasks.types.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.ts';

export class TasksService {
  constructor(private repo: TasksRepository = tasksRepository) {}

  public async listTasks(workspaceId?: string, bucket?: string): Promise<Task[]> {
    const wsId = workspaceId || this.repo.getDefaultWorkspace().id;
    return this.repo.listByWorkspace(wsId, bucket);
  }

  public async getTaskById(id: string): Promise<Task> {
    const task = this.repo.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada.');
    }
    return task;
  }

  public async createTask(dto: CreateTaskDTO): Promise<Task> {
    if (!dto.content || typeof dto.content !== 'string' || dto.content.trim().length === 0) {
      throw new BadRequestError('Descrição da tarefa é obrigatória.');
    }

    const defaultWorkspace = this.repo.getDefaultWorkspace();
    const workspaceId = dto.workspaceId || defaultWorkspace.id;
    const userId = dto.userId || defaultWorkspace.ownerId;

    let noteTitle: string | undefined = undefined;
    if (dto.noteId) {
      const note = this.repo.getNote(dto.noteId);
      noteTitle = note?.title;
    }

    return this.repo.create({
      workspaceId,
      userId,
      noteId: dto.noteId || 'manual',
      noteTitle,
      content: dto.content.trim(),
      isCompleted: false,
      isSuggested: false,
      priorityBucket: dto.priorityBucket || 'focus_today',
      dueDate: dto.dueDate || null,
    });
  }

  public async updateTask(id: string, dto: UpdateTaskDTO): Promise<Task> {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Tarefa não encontrada.');
    }

    const updates: Partial<Task> = {};
    if (dto.content !== undefined) updates.content = dto.content.trim();
    if (dto.isCompleted !== undefined) updates.isCompleted = dto.isCompleted;
    if (dto.priorityBucket !== undefined) updates.priorityBucket = dto.priorityBucket;
    if (dto.dueDate !== undefined) updates.dueDate = dto.dueDate;

    const updated = this.repo.update(id, updates);
    if (!updated) {
      throw new NotFoundError('Tarefa não encontrada para atualização.');
    }
    return updated;
  }

  public async approveTask(id: string): Promise<Task> {
    const task = this.repo.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa sugerida não encontrada.');
    }

    const updated = this.repo.update(id, { isSuggested: false });
    if (!updated) {
      throw new NotFoundError('Falha ao aprovar tarefa sugerida.');
    }
    return updated;
  }

  public async deleteTask(id: string): Promise<boolean> {
    const deleted = this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Tarefa não encontrada para exclusão.');
    }
    return true;
  }
}

export const tasksService = new TasksService();
