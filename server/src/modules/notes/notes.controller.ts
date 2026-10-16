import { Request, Response, NextFunction } from 'express';
import { notesService, NotesService } from './notes.service.ts';

export class NotesController {
  constructor(private service: NotesService = notesService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const search = req.query.search as string | undefined;
      const tag = req.query.tag as string | undefined;
      const sourceType = req.query.sourceType as string | undefined;

      const notes = await this.service.listNotes(workspaceId, { search, tag, sourceType });
      res.json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getNoteWithRelations(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await this.service.createNote(req.body);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateNote(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteNote(req.params.id);
      res.json({ success: true, data: { message: 'Nota excluída com sucesso.' } });
    } catch (error) {
      next(error);
    }
  };
}

export const notesController = new NotesController();
