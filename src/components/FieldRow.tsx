import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface FieldRowProps {
  label: string
  className?: string
  children: ReactNode
}

export function FieldRow({ label, className, children }: FieldRowProps) {
  return (
    <label className={clsx('flex items-center justify-between gap-4', className)}>
      {label}
      {children}
    </label>
  )
}
