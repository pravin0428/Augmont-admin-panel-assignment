import type { SafeUser } from '@modules/user/user.types';

export interface Credentials {
  email: string;
  password: string;
}

/** What the API returns after a successful register/login. */
export interface AuthResult {
  token: string;
  user: SafeUser;
}
