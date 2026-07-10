import clsx from 'clsx'
import { BORDERED_CONTROL_CLASS } from '../styles/controls'
import { FieldRow } from './FieldRow'

export interface NumberFieldRowProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function NumberFieldRow({ label, value, onChange, min, max, step }: NumberFieldRowProps) {
  return (
    <FieldRow label={label}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={clsx(BORDERED_CONTROL_CLASS, 'w-20 px-2 py-1')}
      />
    </FieldRow>
  )
}
