import clsx from 'clsx'
import type { AccentColor } from '../config/theme'
import { SubHeading } from './SubHeading'

export interface AccentPickerProps {
  accent: AccentColor
  onChange: (accent: AccentColor) => void
}

interface AccentOption {
  value: AccentColor
  label: string
  swatchClass: string
}

const ACCENT_OPTIONS: AccentOption[] = [
  { value: 'teal', label: 'Teal', swatchClass: 'bg-swatch-teal' },
  { value: 'blue', label: 'Blue', swatchClass: 'bg-swatch-blue' },
  { value: 'purple', label: 'Purple', swatchClass: 'bg-swatch-purple' },
  { value: 'rose', label: 'Rose', swatchClass: 'bg-swatch-rose' },
  { value: 'amber', label: 'Amber', swatchClass: 'bg-swatch-amber' },
]

export function AccentPicker({ accent, onChange }: AccentPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <SubHeading as="legend" className="mb-2.5">
        Accent color
      </SubHeading>
      <div className="flex gap-3" role="radiogroup" aria-label="Accent color">
        {ACCENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={accent === option.value}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={clsx(
                'h-7 w-7 rounded-full transition-shadow',
                option.swatchClass,
                accent === option.value && 'ring-2 ring-fg ring-offset-2 ring-offset-panel',
              )}
            />
            <span className="font-mono text-[11px] text-dim">{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
