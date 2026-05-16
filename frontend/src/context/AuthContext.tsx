import { useCallback, useMemo, useState, type ReactNode } from 'react'
import ApiError from '@/lib/api-error'
import api from '@/lib/api'
import { signInService } from '@/modules/auth/services/signin.service'
import { AuthContext, type AuthSession } from './auth-context'

function readSessionUser(): AuthSession | null {
  const raw = sessionStorage.getItem('user')
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object' || !('id' in data)) {
      return null
    }
    const o = data as Record<string, unknown>
    if (typeof o.id !== 'number') {
      return null
    }
    if ('access_token' in o || 'refresh_token' in o) {
      const rest = { ...o }
      delete rest.access_token
      delete rest.refresh_token
      sessionStorage.setItem('user', JSON.stringify(rest))
      return rest as AuthSession
    }
    return data as AuthSession
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthSession | null>(() => readSessionUser())

  const loadSessionFromStorage = useCallback(() => {
    setAuth(readSessionUser())
  }, [])

  const signOut = useCallback(async () => {
    setAuth(null)
    sessionStorage.removeItem('user')
    try {
      await api.post('auth/signout')
    } catch {
      // Ignora erro — cookies serão limpos pelo backend assim que possível.
    }
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    const authData = await signInService(username, password)

    if (authData.id == null) {
      throw new ApiError('Resposta inválida do servidor ao autenticar.', 'invalid_auth', [])
    }

    sessionStorage.setItem('user', JSON.stringify(authData))
    setAuth(authData as AuthSession)
  }, [])

  const value = useMemo(
    () => ({
      auth,
      signIn,
      signOut,
      loadSessionFromStorage,
    }),
    [auth, signIn, signOut, loadSessionFromStorage],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
