import { Layers, LayoutDashboard, LogOut, Package, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { ProxyMarketLogo } from '@/components/ProxyMarketLogo'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/context/auth-context'
import { APP_VERSION } from '@/lib/app-version'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/cartas', label: 'Cartas', icon: Layers },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/pedidos', label: 'Pedidos', icon: Package },
]

export function AppShell() {
  const { auth } = useAuth()
  const initials = (auth?.name ?? '?')
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-full min-h-screen bg-background text-foreground">
      <aside className="flex w-16 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground">
        <NavLink
          to="/"
          end
          className="flex size-9 items-center justify-center rounded-md text-primary"
          aria-label="Início"
        >
          <ProxyMarketLogo className="size-6" />
        </NavLink>
        <Separator className="my-2 w-8" />
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        'flex size-9 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors',
                        'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : '',
                      ].join(' ')
                    }
                    aria-label={item.label}
                  >
                    <Icon className="size-4" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/sair"
                className="flex size-9 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive"
                aria-label="Sair"
              >
                <LogOut className="size-4" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary"
                aria-label={auth?.name ?? 'Usuário'}
              >
                {initials}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-xs">
                <div className="font-medium text-foreground">
                  {auth?.name ?? 'Usuário'}
                </div>
                <div className="text-muted-foreground">{auth?.email ?? ''}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>

      <p
        className="text-muted-foreground/35 pointer-events-none fixed bottom-3 right-4 z-10 text-[10px] tabular-nums tracking-tight select-none"
        aria-hidden
      >
        v{APP_VERSION}
      </p>
    </div>
  )
}
