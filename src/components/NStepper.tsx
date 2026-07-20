export const MAX_N = 20

export interface NStepperProps {
  value: number
  onChange: (n: number) => void
  ariaLabel: string
}

function clamp(n: number): number {
  return Math.min(MAX_N, Math.max(1, n))
}

export function NStepper({ value, onChange, ariaLabel }: NStepperProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-panel2 p-[3px]">
      <button
        type="button"
        aria-label="Decrease N"
        onClick={() => onChange(clamp(value - 1))}
        className="h-[30px] w-[34px] rounded-md text-lg hover:bg-panel"
      >
        −
      </button>
      <input
        type="number"
        aria-label={ariaLabel}
        min={1}
        max={MAX_N}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="w-9 [appearance:textfield] bg-transparent text-center font-mono text-lg font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase N"
        onClick={() => onChange(clamp(value + 1))}
        className="h-[30px] w-[34px] rounded-md text-lg hover:bg-panel"
      >
        +
      </button>
    </div>
  )
}
