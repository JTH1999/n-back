import type { ReactNode } from 'react'

export interface TwoColumnLayoutProps {
  main: ReactNode
  side: ReactNode
  sideFirst?: boolean
}

export function TwoColumnLayout({ main, side, sideFirst = false }: TwoColumnLayoutProps) {
  const mainColumn = <div className="flex min-w-0 flex-1 flex-col gap-4">{main}</div>
  const sideColumn = <div className="flex flex-col gap-4 shell:w-[290px] shell:flex-none">{side}</div>

  return (
    <div className="flex flex-col items-stretch gap-4 shell:flex-row shell:items-start">
      {sideFirst ? (
        <>
          {sideColumn}
          {mainColumn}
        </>
      ) : (
        <>
          {mainColumn}
          {sideColumn}
        </>
      )}
    </div>
  )
}
