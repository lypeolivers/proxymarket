import api from '@/lib/api'
import { User, type TUser } from '@/modules/user/types/user.model'

/** GET `/user/me` */
export async function getMeService(): Promise<TUser> {
  const response = await api.get<unknown>('user/me')
  return User.parse(response.data)
}
