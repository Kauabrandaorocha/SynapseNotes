import { authRepository, AuthRepository } from './auth.repository.ts';
import { AuthUser, LoginDTO, RegisterDTO, AuthTokens } from './auth.types.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.ts';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  public async register(dto: RegisterDTO): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestError('E-mail já cadastrado na plataforma.');
    }

    const user = await this.repo.create(dto);
    const tokens = this.generateTokens(user.id);
    return { user, tokens };
  }

  public async login(dto: LoginDTO): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado com este e-mail.');
    }

    const tokens = this.generateTokens(user.id);
    return { user, tokens };
  }

  public async getCurrentUser(): Promise<AuthUser> {
    return this.repo.getDefaultUser();
  }

  private generateTokens(userId: string): AuthTokens {
    return {
      accessToken: `mock-token-${userId}-${Date.now()}`,
      refreshToken: `mock-refresh-${userId}-${Date.now()}`,
      expiresIn: '7d',
    };
  }
}

export const authService = new AuthService();
