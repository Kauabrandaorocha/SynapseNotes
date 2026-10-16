import { Request, Response, NextFunction } from 'express';
import { categoriesService, CategoriesService } from './categories.service.ts';

export class CategoriesController {
  constructor(private service: CategoriesService = categoriesService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const categories = await this.service.listCategories(workspaceId);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };
}

export const categoriesController = new CategoriesController();
