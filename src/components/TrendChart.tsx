import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface TrendPoint {
  date: string
  accuracy: number
  n: number
}

export interface TrendChartProps {
  data: readonly TrendPoint[]
}

const CHART_HEIGHT = 240

export function TrendChart({ data }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data as TrendPoint[]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--dim)" />
        <YAxis
          yAxisId="accuracy"
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
          tick={{ fontSize: 12 }}
          stroke="var(--dim)"
        />
        <YAxis
          yAxisId="n"
          orientation="right"
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          stroke="var(--dim)"
        />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="accuracy"
          type="monotone"
          dataKey="accuracy"
          name="Accuracy (%)"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="n"
          type="monotone"
          dataKey="n"
          name="N-back level"
          stroke="var(--stream-letter)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
