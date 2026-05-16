import api from '@/lib/api'

/** POST `/auth/signout` — sempre responde 204, mesmo quando a sessão já expirou. */
export async function signOutService(): Promise<void> {
  await api.post('auth/signout')
}
