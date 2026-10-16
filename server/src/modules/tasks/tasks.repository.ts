import { db, Task } from '../../infra/database/database-adapter.ts';

export class TasksRepository {
  public findById(id: string): Task | undefined {
    return db.getTask(id);
  }

  public listByWorkspace(workspaceId: string, bucket?: string): Task[] {
    return db.listTasks(workspaceId, bucket);
  }

  public create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Task {
    return db.createTask(taskData);
  }

  public update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'deletedAt'>>): Task | undefined {
    return db.updateTask(id, updates);
  }

  public delete(id: string): boolean {
    return db.deleteTask(id);
  }

  public getDefaultWorkspace() {
    return db.getDefaultWorkspace();
  }

  public getNote(id: string) {
    return db.getNote(id);
  }
}

export const tasksRepository = new TasksRepository();
