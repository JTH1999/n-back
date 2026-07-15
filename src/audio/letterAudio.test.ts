import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { playLetter as PlayLetter, preloadLetterAudio as PreloadLetterAudio, unlockAudio as UnlockAudio } from './letterAudio'

class MockGain {
  gain = { value: 1 }
  connect = vi.fn()
}

class MockBufferSource {
  buffer: unknown
  connect = vi.fn()
  start = vi.fn()
}

function makeMockAudioContext(state: AudioContextState = 'running') {
  const sources: MockBufferSource[] = []
  const gains: MockGain[] = []
  const resume = vi.fn().mockResolvedValue(undefined)
  class MockAudioContext {
    state = state
    destination = {}
    resume = resume
    createBufferSource() {
      const source = new MockBufferSource()
      sources.push(source)
      return source
    }
    createGain() {
      const gain = new MockGain()
      gains.push(gain)
      return gain
    }
    decodeAudioData = vi.fn().mockResolvedValue({ decoded: true })
  }
  return { MockAudioContext, sources, gains, resume }
}

describe('playLetter', () => {
  let speak: ReturnType<typeof vi.fn>
  let cancel: ReturnType<typeof vi.fn>
  let playLetter: typeof PlayLetter
  let preloadLetterAudio: typeof PreloadLetterAudio
  let unlockAudio: typeof UnlockAudio

  beforeEach(async () => {
    vi.resetModules()

    speak = vi.fn()
    cancel = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak, cancel })
    class MockUtterance {
      text: string
      volume = 1
      constructor(text: string) {
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }))

    // Fresh module instance per test so the decoded-buffer cache and cached
    // AudioContext don't leak state between tests.
    ;({ playLetter, preloadLetterAudio, unlockAudio } = await import('./letterAudio'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('speaks the letter via text-to-speech while no AudioContext is available', () => {
    playLetter('C')

    expect(speak).toHaveBeenCalled()
  })

  it('does not play or speak when muted', () => {
    playLetter('L', 1, true)

    expect(speak).not.toHaveBeenCalled()
  })

  it('plays a decoded buffer through the AudioContext once preloaded', async () => {
    const { MockAudioContext, sources, gains } = makeMockAudioContext()
    vi.stubGlobal('AudioContext', MockAudioContext)

    preloadLetterAudio()
    await Promise.resolve().then().then().then()

    playLetter('H', 0.5)

    expect(sources).toHaveLength(1)
    expect(sources[0].start).toHaveBeenCalled()
    expect(gains[0].gain.value).toBe(0.5)
    expect(speak).not.toHaveBeenCalled()
  })

  it('speaks instead of playing a letter whose buffer has not decoded yet', () => {
    const { MockAudioContext } = makeMockAudioContext()
    vi.stubGlobal('AudioContext', MockAudioContext)

    playLetter('K')

    expect(speak).toHaveBeenCalled()
  })

  it('falls back to text-to-speech if decoding the clip fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const { MockAudioContext } = makeMockAudioContext()
    vi.stubGlobal('AudioContext', MockAudioContext)

    preloadLetterAudio()
    await Promise.resolve().then().then().then()

    playLetter('Q', 0.6)

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ volume: 0.6 }))
  })

  it('resumes a suspended AudioContext', () => {
    const { MockAudioContext, resume } = makeMockAudioContext('suspended')
    vi.stubGlobal('AudioContext', MockAudioContext)

    unlockAudio()

    expect(resume).toHaveBeenCalled()
  })
})
