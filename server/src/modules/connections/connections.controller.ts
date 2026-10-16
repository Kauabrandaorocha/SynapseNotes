import { Request, Response, NextFunction } from 'express';
import { connectionsService, ConnectionsService } from './connections.service.ts';

export class ConnectionsController {
  constructor(private service: ConnectionsService = connectionsService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const connections = await this.service.listConnections(workspaceId);
      res.json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  };

  public getForNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connections = await this.service.getConnectionsForNote(req.params.noteId);
      res.json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  };

  public getGraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const graph = await this.service.getGraph(workspaceId);
      res.json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connection = await this.service.createConnection(req.body);
      res.status(201).json({ success: true, data: connection });
    } catch (error) {
      next(error);
    }
  };

  public discover = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const discovered = await this.service.discoverConnections(req.params.noteId);
      res.json({ success: true, data: discovered });
    } catch (error) {
      next(error);
    }
  };
}

export const connectionsController = new ConnectionsController();
