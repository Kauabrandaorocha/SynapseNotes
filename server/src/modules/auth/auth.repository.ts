import crypto from 'crypto';
import { db, User } from '../../infra/database/database-adapter.ts';
import { AuthUser, RegisterDTO } from './auth.types.ts';

export class AuthRepository {
  public async findByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === normalized);
  }

  public async findById(id: string): Promise<User | undefined> {
    return db.users.find((u) => u.id === id);
  }

  public async create(data: RegisterDTO): Promise<AuthUser> {
    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    return newUser;
  }

  public async getDefaultUser(): Promise<AuthUser> {
    if (db.users.length === 0) {
      return this.create({
        email: 'estudante@synapsenotes.local',
        fullName: 'Alice Pesquisadora',
      });
    }
    return db.users[0];
  }
}

export const authRepository = new AuthRepository();
