export function sessionDurationMs(trialCount: number, trialLengthMs: number): number {
  return trialCount * trialLengthMs
}
