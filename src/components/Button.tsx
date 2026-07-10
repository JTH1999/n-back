import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'
import { GHOST_BUTTON_CLASS } from '../styles/controls'

const PRIMARY_BUTTON_CLASS =
  'rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg disabled:cursor-not-allowed disabled:bg-panel disabled:text-dim2'

const ICON_BUTTON_CLASS = 'rounded-md p-2 text-dim hover:bg-panel2 hover:text-danger'

const VARIANT_CLASS = {
  primary: PRIMARY_BUTTON_CLASS,
  ghost: GHOST_BUTTON_CLASS,
  icon: ICON_BUTTON_CLASS,
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_CLASS
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={clsx(VARIANT_CLASS[variant], className)} {...props} />
}
