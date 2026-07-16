import type { AriaRole, ReactNode } from 'react'

const DEFAULT_PANEL_CLASS =
  'flex max-w-[380px] flex-col items-center gap-2.5 rounded-2xl border border-border bg-panel p-8 text-center'

export interface OverlayProps {
  role: AriaRole
  ariaLabel: string
  children: ReactNode
  panelClassName?: string
}

export function Overlay({ role, ariaLabel, children, panelClassName = DEFAULT_PANEL_CLASS }: OverlayProps) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className={panelClassName}>{children}</div>
    </div>
  )
}
