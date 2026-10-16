import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service.ts';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, fullName } = req.body;
      const result = await this.service.register({ email, fullName });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.service.login({ email, password });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getCurrentUser();
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
