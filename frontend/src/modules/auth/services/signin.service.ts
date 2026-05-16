import api from '@/lib/api'
import { SigninResponse, type TSigninResponse } from '@/models/auth.model'

/** POST `/auth/signin` — corpo `{ username, password }`. `username` deve ser o e-mail. */
export async function signInService(
  username: string,
  password: string,
): Promise<TSigninResponse> {
  const response = await api.post<unknown>('auth/signin', {
    username,
    password,
  })
  return SigninResponse.parse(response.data)
}
