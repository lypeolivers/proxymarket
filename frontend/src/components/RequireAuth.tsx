import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

/**
 * Redireciona usuários não autenticados para `/entrar`, preservando a rota
 * de origem em `state.from` para retornar após o login.
 */
export function RequireAuth() {
  const { auth } = useAuth()
  const location = useLocation()

  if (!auth) {
    return <Navigate to="/entrar" state={{ from: location }} replace />
  }

  return <Outlet />
}
