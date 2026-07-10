import clsx from 'clsx'
import type { ReactNode } from 'react'
import { EYEBROW_CLASS } from '../styles/controls'

export interface SubHeadingProps {
  as?: 'span' | 'legend'
  className?: string
  children: ReactNode
}

export function SubHeading({ as: Tag = 'span', className, children }: SubHeadingProps) {
  return <Tag className={clsx(EYEBROW_CLASS, className)}>{children}</Tag>
}
