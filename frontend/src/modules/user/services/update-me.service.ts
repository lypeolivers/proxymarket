import api from '@/lib/api'
import {
  UpdateMeBody,
  User,
  type TUpdateMeBody,
  type TUser,
} from '@/modules/user/types/user.model'

/** PUT `/user/me` — atualiza nome, e-mail e/ou senha do usuário autenticado. */
export async function updateMeService(body: TUpdateMeBody): Promise<TUser> {
  const payload = UpdateMeBody.parse(body)
  const response = await api.put<unknown>('user/me', payload)
  return User.parse(response.data)
}
