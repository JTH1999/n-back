import clsx from 'clsx'
import type { ThemeOverride } from '../config/theme'

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
    <fieldset className="flex flex-col gap-2">
      <legend>Theme</legend>
      <div className="flex gap-2" role="radiogroup" aria-label="Theme">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={override === option.value}
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 rounded border px-2 py-1 text-sm dark:border-slate-600',
              override === option.value
                ? 'bg-blue-500 text-white dark:bg-blue-500'
                : 'dark:bg-slate-800',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
