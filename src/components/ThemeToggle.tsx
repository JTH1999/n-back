import clsx from 'clsx'
import type { ThemeOverride } from '../config/theme'
import { EYEBROW_CLASS } from '../styles/controls'

export interface ThemeToggleProps {
  override: ThemeOverride | null
  onChange: (theme: ThemeOverride | null) => void
}

interface ThemeOption {
  label: string
  value: ThemeOverride | null
}

const THEME_OPTIONS: ThemeOption[] = [
  { label: 'System', value: null },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export function ThemeToggle({ override, onChange }: ThemeToggleProps) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={clsx(EYEBROW_CLASS, 'mb-1')}>Theme</legend>
      <div
        className="flex flex-col gap-1 rounded-lg border border-border bg-panel p-[3px]"
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
              'rounded-md px-2.5 py-2 text-left font-mono text-[13px] transition-colors',
              override === option.value
                ? 'bg-accent text-accent-fg'
                : 'text-dim hover:text-fg',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
