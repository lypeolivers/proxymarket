import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const RefreshTokenResponse = z.object({
  access_token: z.string(),
});

export type TRefreshTokenResponse = z.infer<typeof RefreshTokenResponse>;

export const RefreshTokenSchema = {
  response: {
    200: RefreshTokenResponse,
    401: ErrorResponse,
  },
  description: 'Renova o access token a partir do refresh token (cookie)',
  tags: ['Auth'],
};
