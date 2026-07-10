import type { ReactNode } from 'react'

export interface PanelProps {
  children: ReactNode
}

export function Panel({ children }: PanelProps) {
  return <div className="rounded-xl border border-border bg-panel p-[18px]">{children}</div>
}
