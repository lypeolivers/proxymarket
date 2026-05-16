type Props = {
  className?: string
}

/**
 * Logo provisório do ProxyMarket — placeholder geométrico (carta com selo),
 * substituível por arte definitiva depois.
 */
export function ProxyMarketLogo({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className={className}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M6.75 3A1.75 1.75 0 0 0 5 4.75v14.5C5 20.216 5.784 21 6.75 21h10.5A1.75 1.75 0 0 0 19 19.25v-9.42a3 3 0 0 1-.96.18a3.04 3.04 0 0 1-1.04-.182v9.422a.25.25 0 0 1-.25.25H6.75a.25.25 0 0 1-.25-.25V4.75a.25.25 0 0 1 .25-.25h6.51a3.05 3.05 0 0 1-.01-1.5zM9 8.25A.75.75 0 0 1 9.75 7.5h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 9 8.25M9.75 11h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5m0 3.5h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5"
      />
      <path
        fill="currentColor"
        d="M18.04 2a.55.55 0 0 1 .513.365l.36 1.102a2.04 2.04 0 0 0 1.294 1.294l1.102.36l.011.003a.55.55 0 0 1 0 1.05l-1.102.36a2.04 2.04 0 0 0-1.294 1.294l-.36 1.102a.55.55 0 0 1-1.05 0l-.36-1.102a2.04 2.04 0 0 0-1.294-1.294l-1.102-.36a.55.55 0 0 1 0-1.05l1.102-.36a2.04 2.04 0 0 0 1.294-1.294l.36-1.102A.55.55 0 0 1 18.04 2"
      />
    </svg>
  )
}
