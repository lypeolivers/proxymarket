type ApiErrorInstance = Error & {
  error_code: string;
  errors: unknown;
  status: number;
};

export function ApiError(
  code: string,
  message: string,
  errors?: unknown,
  status?: number
): ApiErrorInstance {
  const err = new Error(message) as ApiErrorInstance;
  err.name = 'ApiError';
  err.error_code = code;
  err.errors = errors ?? undefined;
  err.status = status ?? 400;
  return err;
}
