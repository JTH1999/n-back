import clsx from 'clsx'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** Renders as an ARIA tablist instead of a plain toggle button group. */
  asTabs?: boolean
  idPrefix?: string
  size?: 'md' | 'sm'
  surface?: 'panel' | 'panel2'
  fill?: boolean
}

const SIZE_CLASS: Record<'md' | 'sm', string> = {
  md: 'px-3 py-2 text-[13px]',
  sm: 'px-2.5 py-1 text-[11px]',
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  asTabs = false,
  idPrefix,
  size = 'md',
  surface = 'panel',
  fill = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx('flex gap-1 rounded-lg border border-border p-[3px]', surface === 'panel' ? 'bg-panel' : 'bg-panel2')}
      role={asTabs ? 'tablist' : 'group'}
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            role={asTabs ? 'tab' : undefined}
            id={asTabs && idPrefix ? `${idPrefix}-tab-${option.value}` : undefined}
            aria-selected={asTabs ? selected : undefined}
            aria-controls={asTabs && idPrefix ? `${idPrefix}-tabpanel-${option.value}` : undefined}
            aria-pressed={asTabs ? undefined : selected}
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-md font-mono transition-colors',
              fill && 'flex-1',
              SIZE_CLASS[size],
              selected ? 'bg-accent text-accent-fg' : 'text-dim hover:text-fg',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
