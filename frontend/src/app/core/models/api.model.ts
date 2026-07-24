/**
 * Mirror of the backend's response envelope. Keeping these in one place means
 * the whole app parses API results the same way, and a contract change is a
 * one-file edit that the compiler propagates everywhere.
 */

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: FieldError[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Envelope returned by every paginated list endpoint. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
