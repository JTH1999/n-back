import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

export interface TrendPoint {
  date: string
  accuracy: number
  n: number
}

export interface TrendChartProps {
  data: readonly TrendPoint[]
}

const CHART_WIDTH = 600
const CHART_HEIGHT = 240
const AXIS_COLOR = '#64748b'
const GRID_COLOR = '#e2e8f0'

export function TrendChart({ data }: TrendChartProps) {
  return (
    <LineChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={data as TrendPoint[]}
      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      className="h-auto w-full max-w-full"
    >
      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke={AXIS_COLOR} />
      <YAxis
        yAxisId="accuracy"
        domain={[0, 100]}
        tickFormatter={(value: number) => `${value}%`}
        tick={{ fontSize: 12 }}
        stroke={AXIS_COLOR}
      />
      <YAxis
        yAxisId="n"
        orientation="right"
        allowDecimals={false}
        tick={{ fontSize: 12 }}
        stroke={AXIS_COLOR}
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
