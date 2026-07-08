import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrendChart, type TrendPoint } from './TrendChart'

const data: TrendPoint[] = [
  { date: '7/1/2026', accuracy: 60, n: 2 },
  { date: '7/5/2026', accuracy: 80, n: 3 },
]

describe('TrendChart', () => {
  it('renders a line series for accuracy and for N-back level', () => {
    const { container } = render(<TrendChart data={data} />)

    expect(container.querySelectorAll('.recharts-line')).toHaveLength(2)
    expect(screen.getByText('Accuracy (%)')).toBeInTheDocument()
    expect(screen.getByText('N-back level')).toBeInTheDocument()
  })

  it('plots one point per recorded session on the x-axis', () => {
    const { container } = render(<TrendChart data={data} />)

    expect(container.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick')).toHaveLength(
      data.length,
    )
  })
})
