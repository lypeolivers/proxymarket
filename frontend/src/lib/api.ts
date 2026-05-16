import axios, { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import ApiError from './api-error'

let refreshPromise: Promise<void> | null = null
let isRedirecting = false

function apiBaseFromVitePublicPath(): string {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return '/api/'
  return `${base.replace(/\/$/, '')}/api/`
}

/**
 * Base da API.
 * - Com SPA em subcaminho (`BASE_URL` = `/proxymarket/`), a API deve ser `/proxymarket/api/...`.
 * - URL absoluta `http(s)://...` continua válida (API em outro domínio).
 */
export function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_APP_API_BASE_URL
  const viteBase = import.meta.env.BASE_URL

  if (typeof explicit === 'string' && explicit.trim() !== '') {
    const e = explicit.trim()
    if (/^https?:\/\//i.test(e)) {
      return e.endsWith('/') ? e : `${e}/`
    }
    if ((e === '/api' || e === '/api/') && viteBase && viteBase !== '/') {
      return apiBaseFromVitePublicPath()
    }
    return e.endsWith('/') ? e : `${e}/`
  }
  return apiBaseFromVitePublicPath()
}

export const apiBaseUrl = resolveApiBaseUrl()

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function isAuthRequest(config: InternalAxiosRequestConfig): boolean {
  const u = config.url ?? ''
  return (
    u.includes('auth/signin') ||
    u.includes('auth/refresh') ||
    u.includes('auth/signout')
  )
}

/**
 * Lê o cookie `csrf_token` (não-httpOnly por design) para o padrão
 * double-submit. Retorna `null` se ausente.
 */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

api.interceptors.request.use((request) => {
  const headers = (request.headers ?? {}) as Record<string, string>

  if (request.data instanceof FormData) {
    delete headers['Content-Type']
  }

  headers.source = 'web'
  headers['Cache-Control'] = 'no-cache'

  const csrf = readCsrfCookie()
  if (csrf) {
    headers['X-CSRF-Token'] = csrf
  }

  request.headers = headers as typeof request.headers
  return request
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string | number; errors?: string[] }>) => {
    if (error.response) {
      // Sessões anteriores ao deploy do CSRF não possuem o cookie csrf_token.
      // Ao receber 403 csrf-invalid, fazemos um refresh (isento de CSRF) para
      // obter o cookie e repetimos a requisição original.
      if (
        error.response.status === 403 &&
        error.response.data?.code === 'csrf-invalid' &&
        error.config &&
        !isAuthRequest(error.config) &&
        !(error.config as { __csrfRetried?: boolean }).__csrfRetried
      ) {
        ;(error.config as { __csrfRetried?: boolean }).__csrfRetried = true
        if (!refreshPromise) {
          refreshPromise = api
            .post('auth/refresh')
            .then(() => {})
            .catch(() => Promise.reject(error))
            .finally(() => {
              refreshPromise = null
            })
        }
        try {
          await refreshPromise
          return await api(error.config)
        } catch {
          return Promise.reject(error)
        }
      }

      if (error.response.status === 401) {
        const originalRequest = error.config

        if (originalRequest && !isAuthRequest(originalRequest)) {
          if (isRedirecting) {
            return Promise.reject(error)
          }

          if (!refreshPromise) {
            refreshPromise = api
              .post('auth/refresh')
              .then(() => {})
              .catch(() => {
                if (!isRedirecting) {
                  isRedirecting = true
                  sessionStorage.removeItem('user')
                  window.location.href = `${import.meta.env.BASE_URL}sair?expired=1`
                }
                return Promise.reject(new Error('Session expired'))
              })
              .finally(() => {
                refreshPromise = null
              })
          }

          try {
            await refreshPromise
            return await api(originalRequest)
          } catch {
            return Promise.reject(error)
          }
        }
      }

      const data = error.response.data
      if (data && typeof data === 'object') {
        return Promise.reject(
          new ApiError(
            data.message ?? 'Erro na requisição',
            String(data.code ?? 'unknown'),
            Array.isArray(data.errors) ? data.errors : [],
            error.response.status,
          ),
        )
      }

      if (!navigator.onLine) {
        return Promise.reject(
          new ApiError(
            'Parece que você está offline. Verifique sua conexão com a internet, recarregue a página e tente novamente.',
            'offline',
            [],
          ),
        )
      }

      const status = error.response.status
      const rawBody: unknown = error.response.data
      const looksLikeHtml =
        typeof rawBody === 'string' && /<html[\s>]/i.test(rawBody.slice(0, 400))
      const msg = looksLikeHtml
        ? `O servidor respondeu com HTML em vez de JSON (${status ?? 'sem status'}). Verifique se a API está em execução e se o proxy/base URL estão corretos.`
        : status != null
          ? `Falha na requisição (HTTP ${status}).`
          : isAxiosError(error) && error.code === 'ERR_NETWORK'
            ? 'Sem conexão com o servidor. Confirme se a API está em execução e acessível.'
            : 'Não foi possível contactar o servidor.'
      return Promise.reject(new ApiError(msg, 'http_error', [], status))
    }

    return Promise.reject(error)
  },
)

export default api
