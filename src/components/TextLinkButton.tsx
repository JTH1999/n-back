import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export type TextLinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function TextLinkButton({ className, type = 'button', ...props }: TextLinkButtonProps) {
  return (
    <button
      type={type}
      className={clsx('text-center text-[13px] text-dim underline decoration-dotted hover:text-fg', className)}
      {...props}
    />
  )
}
