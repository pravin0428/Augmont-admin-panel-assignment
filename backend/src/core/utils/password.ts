import bcrypt from 'bcryptjs';
import { config } from '@config/env';

/**
 * Password hashing utility.
 *
 * WHY bcryptjs (vs the native `bcrypt`): identical API and security, but a pure
 * JS implementation with NO native build step. That means zero node-gyp/Python
 * toolchain requirements and trivial, reliable Docker (Alpine) builds. The
 * hashing algorithm (bcrypt) is the same.
 *
 * WHY bcrypt at all: it is a deliberately SLOW, salted, adaptive hash. Salting
 * defeats rainbow tables; the tunable cost factor (salt rounds) lets us keep
 * pace with hardware so brute-forcing stays expensive.
 *
 * Isolated here so the whole app hashes/compares one way — swappable to argon2
 * later by editing only this file (Single Responsibility + easy migration).
 */
export const passwordHasher = {
  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, config.auth.bcryptSaltRounds);
  },

  compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  },
};
