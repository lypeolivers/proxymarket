import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { ProxyMarketLogo } from '@/components/ProxyMarketLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { APP_VERSION } from '@/lib/app-version'
import ApiError from '@/lib/api-error'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { auth, signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  useEffect(() => {
    if (auth) {
      navigate(from !== '/entrar' ? from : '/', { replace: true })
    }
  }, [auth, from, navigate])

  useEffect(() => {
    if (searchParams.get('expired')) {
      setErrorMessage('Sua sessão expirou. Faça login novamente.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    const form = e.currentTarget
    const username = (form.elements.namedItem('username') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    setSubmitting(true)
    try {
      await signIn(username.trim(), password)
      navigate(from !== '/entrar' ? from : '/', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Falha ao realizar login. Verifique suas credenciais e tente novamente.'
      setErrorMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full lg:grid lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col p-10 text-primary lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary/5" aria-hidden />
        <div className="relative z-20 flex items-center gap-2 text-xl font-medium">
          <ProxyMarketLogo className="size-7" />
          ProxyMarket
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="text-balance leading-normal">
            &ldquo;Organize suas vendas de proxys em um lugar só — sem perder
            pedidos, prazos ou margens em planilhas.&rdquo;
          </blockquote>
        </div>
      </div>

      <div className="flex min-h-full items-center justify-center p-6 pt-16 lg:min-h-screen lg:p-8 lg:pt-8">
        <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Entrar na sua conta
            </h1>
          </div>

          <div className="grid gap-6">
            {errorMessage ? (
              <p
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            <form className="grid gap-6" onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="auth-username">E-mail</Label>
                  <Input
                    id="auth-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="voce@exemplo.com"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="auth-password">Senha</Label>
                    <button
                      type="button"
                      className="text-muted-foreground text-xs font-medium underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? (
                        <span className="inline-flex items-center gap-1">
                          <EyeOff className="size-3" />
                          Ocultar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3" />
                          Mostrar
                        </span>
                      )}
                    </button>
                  </div>
                  <Input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p
        className="text-muted-foreground/35 pointer-events-none fixed bottom-3 left-1/2 z-10 -translate-x-1/2 text-[10px] tabular-nums tracking-tight select-none lg:left-auto lg:right-4 lg:translate-x-0"
        aria-hidden
      >
        v{APP_VERSION}
      </p>
    </div>
  )
}
