import { useEffect, useState } from 'react'
import { loadDraftSettings, saveDraftSettings } from '../persistence/settingsStorage'
import type { SessionRunnerConfig } from './useSessionRunner'

export const DEFAULT_CONFIG: SessionRunnerConfig = {
  n: 2,
  trialCount: 20,
  streams: ['position'],
  displayDurationMs: 500,
  trialLengthMs: 2500,
  volume: 1,
  muted: false,
  liveFeedback: false,
  adaptive: {
    enabled: false,
    lowerThreshold: 0.5,
    upperThreshold: 0.8,
  },
}

export function useDraftConfig() {
  const [config, setConfig] = useState<SessionRunnerConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...loadDraftSettings<SessionRunnerConfig>(),
  }))

  useEffect(() => {
    saveDraftSettings(config)
  }, [config])

  return [config, setConfig] as const
}
