import { Request, Response, NextFunction } from 'express';
import { tasksService, TasksService } from './tasks.service.ts';

export class TasksController {
  constructor(private service: TasksService = tasksService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const bucket = req.query.bucket as string | undefined;
      const tasks = await this.service.listTasks(workspaceId, bucket);
      res.json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.service.createTask(req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateTask(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approved = await this.service.approveTask(req.params.id);
      res.json({ success: true, data: approved });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteTask(req.params.id);
      res.json({ success: true, data: { message: 'Tarefa excluída com sucesso.' } });
    } catch (error) {
      next(error);
    }
  };
}

export const tasksController = new TasksController();
