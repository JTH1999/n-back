import type { AriaRole, ReactNode } from 'react'

export interface OverlayProps {
  role: AriaRole
  ariaLabel: string
  children: ReactNode
}

export function Overlay({ role, ariaLabel, children }: OverlayProps) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="flex max-w-[380px] flex-col items-center gap-2.5 rounded-2xl border border-border bg-panel p-8 text-center">
        {children}
      </div>
    </div>
  )
}
