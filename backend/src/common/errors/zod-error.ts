export type ValidationErrorItem = {
  type: string;
  message: string;
  path: (string | number)[];
};

interface ZodLikeError {
  issues: Array<{ code: string; message: string; path: (string | number)[] }>;
}

export const VALIDATION_ERROR_MESSAGE =
  'Data validation error. Some data are missing or invalid';

export function parseZodValidation(zodError: ZodLikeError): ValidationErrorItem[] {
  return zodError.issues.map((issue) => ({
    type: issue.code,
    message: issue.message,
    path: issue.path,
  }));
}
