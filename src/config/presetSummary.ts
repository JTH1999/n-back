import type { SessionRunnerConfig } from '../adapters/useSessionRunner'

export function summarizePresetConfig(config: SessionRunnerConfig): string {
  const streams = config.streams.length > 0 ? config.streams.join(', ') : 'none'
  return `N${config.n} · ${streams} · ${config.trialCount}t`
}
