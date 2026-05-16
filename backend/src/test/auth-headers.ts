import { signAccessToken } from '../common/helpers/jwt';

/** Header `Authorization: Bearer <token>` para testes integrados. */
export function authorizationHeader(userId = 1): { authorization: string } {
  return { authorization: `Bearer ${signAccessToken(userId)}` };
}
