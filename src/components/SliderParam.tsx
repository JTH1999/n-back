import { RANGE_INPUT_CLASS } from '../styles/controls'

export interface SliderParamProps {
  label: string
  hint?: string
  ariaLabel: string
  valueLabel: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function SliderParam({
  label,
  hint,
  ariaLabel,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: SliderParamProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-4 last:border-none">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{label}</span>
        {hint && <span className="font-mono text-xs font-normal text-dim">{hint}</span>}
        <span className="ml-auto font-mono text-xs text-accent">{valueLabel}</span>
      </div>
      <input
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={RANGE_INPUT_CLASS}
      />
    </div>
  )
}
