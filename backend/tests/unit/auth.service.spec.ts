import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@modules/auth/auth.service';
import { UserService } from '@modules/user/user.service';
import type { IUserRepository, SafeUser } from '@modules/user/user.types';
import { UnauthorizedError } from '@core/errors/app-error';

/**
 * Auth flow tested end-to-end across AuthService + UserService with an in-memory
 * user repository (no DB). Uses the real password hasher, so this also verifies
 * that a registered password actually validates on login.
 */
class InMemoryUserRepository implements IUserRepository {
  private users: (SafeUser & { password: string })[] = [];
  private seq = 1;

  async findManyActive(): Promise<SafeUser[]> {
    return this.users.map(({ password: _p, ...u }) => u);
  }
  async findActiveById(id: number): Promise<SafeUser | null> {
    const found = this.users.find((u) => u.id === id);
    if (!found) return null;
    const { password: _p, ...safe } = found;
    return safe;
  }
  async findActiveByEmailWithPassword(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async existsByEmail(email: string, excludeId?: number): Promise<boolean> {
    return this.users.some((u) => u.email === email && u.id !== excludeId);
  }
  async create(data: { email: string; password: string }): Promise<SafeUser> {
    const user = {
      id: this.seq++,
      email: data.email,
      password: data.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    const { password: _p, ...safe } = user;
    return safe;
  }
  async update(): Promise<SafeUser> {
    throw new Error('not needed');
  }
  async softDelete(): Promise<void> {
    /* no-op */
  }
}

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    const repo = new InMemoryUserRepository();
    auth = new AuthService(new UserService(repo));
  });

  it('registers a user and returns a token', async () => {
    const result = await auth.register({ email: 'a@b.com', password: 'password1' });
    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('a@b.com');
    // The password hash must never be leaked in the returned user.
    expect((result.user as Record<string, unknown>).password).toBeUndefined();
  });

  it('logs in with correct credentials', async () => {
    await auth.register({ email: 'a@b.com', password: 'password1' });
    const result = await auth.login({ email: 'a@b.com', password: 'password1' });
    expect(result.token).toBeTypeOf('string');
  });

  it('rejects a wrong password with UnauthorizedError', async () => {
    await auth.register({ email: 'a@b.com', password: 'password1' });
    await expect(auth.login({ email: 'a@b.com', password: 'wrong-pass' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects an unknown email with UnauthorizedError', async () => {
    await expect(auth.login({ email: 'nope@b.com', password: 'password1' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
