import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { TooltipProvider } from './components/ui/tooltip'
import { AppShell } from './layouts/AppShell'
import { AuthPage } from './pages/AuthPage'
import { ClientesPage } from './pages/ClientesPage'
import { CartasPage } from './pages/CartasPage'
import { DashboardPage } from './pages/DashboardPage'
import { LogoutPage } from './pages/LogoutPage'
import { PedidosPage } from './pages/PedidosPage'

export default function App() {
  const basename =
    import.meta.env.BASE_URL === '/'
      ? undefined
      : import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="entrar" element={<AuthPage />} />
            <Route path="sair" element={<LogoutPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="cartas" element={<CartasPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="pedidos" element={<PedidosPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
