import type { StreamKind } from '../engine/streams'

export interface PresetSummaryConfig {
  n: number
  trialCount: number
  streams: readonly StreamKind[]
}

export function summarizePresetConfig(config: PresetSummaryConfig): string {
  const streams = config.streams.length > 0 ? config.streams.join(', ') : 'none'
  return `N${config.n} · ${streams} · ${config.trialCount}t`
}
