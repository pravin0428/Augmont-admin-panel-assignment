import { passwordHasher } from '@core/utils/password';
import { ConflictError, NotFoundError } from '@core/errors/app-error';
import { userRepository } from './user.repository';
import type {
  CreateUserInput,
  IUserRepository,
  SafeUser,
  UpdateUserInput,
} from './user.types';

/**
 * User business logic.
 *
 * Owns the rules around users regardless of transport (HTTP, CLI, tests):
 *   - emails are unique among active users,
 *   - passwords are always stored hashed, never plaintext.
 *
 * Depends on the repository ABSTRACTION (IUserRepository), not Prisma — so it is
 * unit-testable with a fake repo and unaffected by DB changes (DIP).
 */
export class UserService {
  constructor(private readonly repo: IUserRepository) {}

  getAll(): Promise<SafeUser[]> {
    return this.repo.findManyActive();
  }

  async getById(id: number): Promise<SafeUser> {
    const user = await this.repo.findActiveById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  /**
   * Creates a user with a hashed password. Shared by admin "create user" and
   * self-service "register" so hashing + uniqueness live in exactly one place.
   */
  async create(input: CreateUserInput): Promise<SafeUser> {
    if (await this.repo.existsByEmail(input.email)) {
      throw new ConflictError('A user with this email already exists');
    }
    const password = await passwordHasher.hash(input.password);
    return this.repo.create({ email: input.email, password });
  }

  async update(id: number, input: UpdateUserInput): Promise<SafeUser> {
    // Ensure the user exists (and is active) before mutating.
    await this.getById(id);

    if (input.email && (await this.repo.existsByEmail(input.email, id))) {
      throw new ConflictError('A user with this email already exists');
    }

    const data: Partial<{ email: string; password: string }> = {};
    if (input.email) data.email = input.email;
    if (input.password) data.password = await passwordHasher.hash(input.password);

    return this.repo.update(id, data);
  }

  async remove(id: number): Promise<void> {
    await this.getById(id); // 404 if absent
    await this.repo.softDelete(id);
  }

  /** Credential lookup for authentication — returns the hash for comparison. */
  findByEmailForAuth(email: string): Promise<(SafeUser & { password: string }) | null> {
    return this.repo.findActiveByEmailWithPassword(email);
  }
}

// Wired singleton used by controllers.
export const userService = new UserService(userRepository);
