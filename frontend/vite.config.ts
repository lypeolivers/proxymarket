import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const viteDir = path.dirname(fileURLToPath(import.meta.url))
const appVersion = (
  JSON.parse(readFileSync(path.join(viteDir, 'package.json'), 'utf-8')) as {
    version: string
  }
).version

/** Base pública (ex.: `/proxymarket/` quando a app fica em http://host:8080/proxymarket). Deve terminar com `/`. */
function normalizeBase(raw: string | undefined): string {
  if (!raw || raw === '/') return '/'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeBase(env.VITE_BASE_PATH)

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(viteDir, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3333',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
