export interface Credentials {
  email: string;
  password: string;
}

/** The authenticated user as returned by the API (no password). */
export interface AuthUser {
  id: number;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}
