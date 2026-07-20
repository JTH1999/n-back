import type { Preset } from '../hooks/usePresets'

const SHARED_CONFIG = {
  n: 2,
  streams: ['position', 'letter'],
  trialCount: 20,
  displayDurationMs: 500,
  matchRate: 0.3,
  liveFeedback: false,
  adaptive: { enabled: false, lowerThreshold: 0.5, upperThreshold: 0.8 },
} as const

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'builtin-easy',
    name: 'Easy',
    readOnly: true,
    config: { ...SHARED_CONFIG, trialLengthMs: 4000 },
  },
  {
    id: 'builtin-standard',
    name: 'Standard',
    readOnly: true,
    config: { ...SHARED_CONFIG, trialLengthMs: 3000 },
  },
  {
    id: 'builtin-hard',
    name: 'Hard',
    readOnly: true,
    config: { ...SHARED_CONFIG, trialLengthMs: 2000 },
  },
]
