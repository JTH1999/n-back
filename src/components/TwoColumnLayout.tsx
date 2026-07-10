import type { ReactNode } from 'react'

export interface TwoColumnLayoutProps {
  main: ReactNode
  side: ReactNode
}

export function TwoColumnLayout({ main, side }: TwoColumnLayoutProps) {
  return (
    <div className="flex flex-col items-stretch gap-4 shell:flex-row shell:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">{main}</div>
      <div className="flex flex-col gap-4 shell:w-[290px] shell:flex-none">{side}</div>
    </div>
  )
}
