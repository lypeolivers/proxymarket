import api from '@/lib/api'

/** POST `/auth/refresh` — backend rotaciona cookies (access + refresh + CSRF). */
export async function refreshTokenService(): Promise<{ access_token: string }> {
  const response = await api.post<{ access_token: string }>('auth/refresh')
  return response.data
}
