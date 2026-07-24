import { prisma } from '@core/db/prisma';
import type { IUserRepository, SafeUser } from './user.types';

/**
 * Prisma-backed implementation of IUserRepository.
 *
 * Responsibilities: DATA ACCESS ONLY. No business rules, no HTTP. It knows how
 * to talk to Postgres via Prisma and nothing else (Single Responsibility).
 *
 * Every read filters `deletedAt: null` so soft-deleted rows are invisible to
 * the rest of the app — the soft-delete policy is enforced in one place.
 */

// Reused projection so we never accidentally select the password hash.
const safeUserSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

class UserRepository implements IUserRepository {
  findManyActive(): Promise<SafeUser[]> {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findActiveById(id: number): Promise<SafeUser | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: safeUserSelect,
    });
  }

  findActiveByEmailWithPassword(
    email: string,
  ): Promise<(SafeUser & { password: string }) | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { ...safeUserSelect, password: true },
    });
  }

  async existsByEmail(email: string, excludeId?: number): Promise<boolean> {
    const found = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  create(data: { email: string; password: string }): Promise<SafeUser> {
    return prisma.user.create({ data, select: safeUserSelect });
  }

  update(
    id: number,
    data: Partial<{ email: string; password: string }>,
  ): Promise<SafeUser> {
    return prisma.user.update({ where: { id }, data, select: safeUserSelect });
  }

  async softDelete(id: number): Promise<void> {
    // Set the deleted marker instead of removing the row.
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

// Export a single wired instance (composition root for this module).
export const userRepository: IUserRepository = new UserRepository();
