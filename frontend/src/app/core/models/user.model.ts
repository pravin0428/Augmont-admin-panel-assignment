export interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
}
