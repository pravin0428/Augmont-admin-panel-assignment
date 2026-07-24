/**
 * User module DTOs and contracts.
 *
 * WHY a `SafeUser` type: the password hash must NEVER leave the service layer.
 * By modelling the "safe" shape explicitly and mapping to it, we make leaking
 * the hash a compile error rather than a code-review catch.
 */

/** User as safely exposed by the API (no password hash). */
export interface SafeUser {
  id: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for creating a user. */
export interface CreateUserInput {
  email: string;
  password: string; // plaintext; hashed inside the service before persistence
}

/** Input for updating a user. All fields optional (partial update). */
export interface UpdateUserInput {
  email?: string;
  password?: string;
}

/**
 * Repository contract (the abstraction the service depends on — DIP).
 * The service knows nothing about Prisma; a test can supply a fake repo.
 */
export interface IUserRepository {
  findManyActive(): Promise<SafeUser[]>;
  findActiveById(id: number): Promise<SafeUser | null>;
  /** Includes the password hash — used ONLY for auth credential checks. */
  findActiveByEmailWithPassword(
    email: string,
  ): Promise<(SafeUser & { password: string }) | null>;
  existsByEmail(email: string, excludeId?: number): Promise<boolean>;
  create(data: { email: string; password: string }): Promise<SafeUser>;
  update(id: number, data: Partial<{ email: string; password: string }>): Promise<SafeUser>;
  softDelete(id: number): Promise<void>;
}
