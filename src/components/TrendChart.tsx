import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResolvedTheme } from '../config/theme'

export interface TrendPoint {
  date: string
  accuracy: number
  n: number
}

export interface TrendChartProps {
  data: readonly TrendPoint[]
  resolvedTheme?: ResolvedTheme
}

const CHART_WIDTH = 600
const CHART_HEIGHT = 240

const AXIS_COLOR: Record<ResolvedTheme, string> = {
  light: '#64748b',
  dark: '#94a3b8',
}
const GRID_COLOR: Record<ResolvedTheme, string> = {
  light: '#e2e8f0',
  dark: '#334155',
}

export function TrendChart({ data, resolvedTheme = 'light' }: TrendChartProps) {
  const axisColor = AXIS_COLOR[resolvedTheme]
  const gridColor = GRID_COLOR[resolvedTheme]

  return (
    <LineChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={data as TrendPoint[]}
      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      className="h-auto w-full max-w-full"
    >
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke={axisColor} />
      <YAxis
        yAxisId="accuracy"
        domain={[0, 100]}
        tickFormatter={(value: number) => `${value}%`}
        tick={{ fontSize: 12 }}
        stroke={axisColor}
      />
      <YAxis
        yAxisId="n"
        orientation="right"
        allowDecimals={false}
        tick={{ fontSize: 12 }}
        stroke={axisColor}
      />
      <Tooltip />
      <Legend />
      <Line
        yAxisId="accuracy"
        type="monotone"
        dataKey="accuracy"
        name="Accuracy (%)"
        stroke="#3b82f6"
        strokeWidth={2}
        dot={false}
      />
      <Line
        yAxisId="n"
        type="monotone"
        dataKey="n"
        name="N-back level"
        stroke="#f97316"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  )
}
