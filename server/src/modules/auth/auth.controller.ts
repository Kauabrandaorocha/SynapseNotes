import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service.ts';
import { setAuthCookie, clearAuthCookie } from '../../shared/utils/cookie.ts';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, fullName } = req.body;
      const result = await this.service.register({ email, fullName });
      // Define cookie HttpOnly seguro com token JWT
      setAuthCookie(res, req, result.tokens.accessToken);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.service.login({ email, password });
      // Define cookie HttpOnly seguro com token JWT
      setAuthCookie(res, req, result.tokens.accessToken);
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

  public getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.service.getSession();
      // Renova / garante o cookie HttpOnly seguro com token JWT
      setAuthCookie(res, req, session.tokens.accessToken);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      clearAuthCookie(res, req);
      res.json({
        success: true,
        data: { message: 'Sessão encerrada com sucesso e cookie de autenticação removido.' },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
