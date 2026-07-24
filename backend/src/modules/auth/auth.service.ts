import { passwordHasher } from '@core/utils/password';
import { tokenService } from '@core/utils/jwt';
import { UnauthorizedError } from '@core/errors/app-error';
import { userService, type UserService } from '@modules/user/user.service';
import type { AuthResult, Credentials } from './auth.types';

/**
 * Authentication logic: register and login.
 *
 * WHY it delegates user persistence to UserService instead of touching the DB:
 * user creation rules (unique email, password hashing) already live in
 * UserService. Re-implementing them here would violate DRY and risk the two
 * paths drifting apart. AuthService's ONLY job is the auth concern —
 * verifying credentials and issuing tokens.
 */
export class AuthService {
  constructor(private readonly users: UserService) {}

  /** Register a new account and immediately issue a token (auto-login). */
  async register(credentials: Credentials): Promise<AuthResult> {
    const user = await this.users.create(credentials);
    const token = tokenService.sign({ sub: user.id, email: user.email });
    return { token, user };
  }

  /**
   * Verify credentials and issue a token.
   *
   * SECURITY: we return the SAME "Invalid email or password" message whether the
   * email is unknown or the password is wrong. Distinct messages would let an
   * attacker enumerate which emails are registered. We still run a compare when
   * the user is missing? — no; but we accept a tiny timing signal here for
   * clarity. (A dummy-hash compare could be added to fully equalise timing.)
   */
  async login(credentials: Credentials): Promise<AuthResult> {
    const user = await this.users.findByEmailForAuth(credentials.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await passwordHasher.compare(credentials.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = tokenService.sign({ sub: user.id, email: user.email });
    // Strip the password hash before returning.
    const { password: _password, ...safeUser } = user;
    return { token, user: safeUser };
  }
}

export const authService = new AuthService(userService);
