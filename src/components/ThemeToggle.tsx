import clsx from 'clsx'
import type { ThemeOverride } from '../config/theme'
import { SubHeading } from './SubHeading'

export interface ThemeToggleProps {
  override: ThemeOverride | null
  onChange: (theme: ThemeOverride | null) => void
  variant?: 'stacked' | 'compact'
}

interface ThemeOption {
  label: string
  value: ThemeOverride | null
}

export const THEME_OPTIONS: ThemeOption[] = [
  { label: 'System', value: null },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export function ThemeToggle({ override, onChange, variant = 'stacked' }: ThemeToggleProps) {
  const radiogroup = (
    <div
      className={clsx(
        'rounded-lg border border-border bg-panel p-[3px]',
        variant === 'stacked' ? 'flex flex-col gap-1' : 'flex gap-1',
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.label}
          type="button"
          role="radio"
          aria-checked={override === option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'rounded-md font-mono transition-colors',
            variant === 'stacked'
              ? 'px-2.5 py-2 text-left text-[13px]'
              : 'flex-1 px-2 py-1.5 text-[11px] capitalize',
            override === option.value ? 'bg-accent text-accent-fg' : 'text-dim hover:text-fg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  if (variant === 'compact') return radiogroup

  return (
    <fieldset className="flex flex-col gap-2.5">
      <SubHeading as="legend" className="mb-1">
        Theme
      </SubHeading>
      {radiogroup}
    </fieldset>
  )
}
