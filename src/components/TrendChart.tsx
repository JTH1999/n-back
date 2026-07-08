export interface TrendChartProps {
  label: string
  values: readonly number[]
  formatValue: (value: number) => string
}

const WIDTH = 100
const HEIGHT = 32

export function TrendChart({ label, values, formatValue }: TrendChartProps) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((value, index) => {
      const x = values.length > 1 ? (index / (values.length - 1)) * WIDTH : WIDTH / 2
      const y = HEIGHT - ((value - min) / range) * HEIGHT
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500">{formatValue(values[values.length - 1])}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-12 w-full text-blue-500" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
      </svg>
    </div>
  )
}
