import { authRepository, AuthRepository } from './auth.repository.ts';
import { AuthUser, LoginDTO, RegisterDTO, AuthTokens } from './auth.types.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.ts';

import { JwtUtil } from '../../shared/utils/jwt.ts';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  public async register(dto: RegisterDTO): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestError('E-mail já cadastrado na plataforma.');
    }

    const user = await this.repo.create(dto);
    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  public async login(dto: LoginDTO): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado com este e-mail.');
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  public async getCurrentUser(): Promise<AuthUser> {
    return this.repo.getDefaultUser();
  }

  public async getSession(): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Retorna a sessão ativa (Admin ou usuário padrão)
    const adminUser = await this.repo.findByEmail('admin@synapsenotes.com');
    const user = adminUser || (await this.repo.getDefaultUser());
    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  private generateTokens(user: AuthUser): AuthTokens {
    const role = user.email.toLowerCase().includes('admin') ? 'admin' : 'user';
    const accessToken = JwtUtil.sign({
      userId: user.id,
      email: user.email,
      role,
    });

    const refreshToken = JwtUtil.sign(
      {
        userId: user.id,
        email: user.email,
        role,
      },
      30 * 24 * 3600,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: '7d',
    };
  }
}

export const authService = new AuthService();
