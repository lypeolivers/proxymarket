import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

export function LogoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { auth, signOut } = useAuth()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const expired = searchParams.get('expired')
    const redirectTo = expired ? '/entrar?expired=1' : '/entrar'

    if (!auth) {
      sessionStorage.removeItem('user')
      navigate(redirectTo, { replace: true })
      return
    }

    void signOut().then(() => {
      navigate(redirectTo, { replace: true })
    })
  }, [navigate, searchParams, signOut, auth])

  return (
    <div className="flex min-h-full items-center justify-center bg-background text-muted-foreground">
      Saindo…
    </div>
  )
}
