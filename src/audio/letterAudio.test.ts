import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playLetter } from './letterAudio'

describe('playLetter', () => {
  let play: ReturnType<typeof vi.fn>
  let addEventListener: ReturnType<typeof vi.fn>
  let speak: ReturnType<typeof vi.fn>
  let cancel: ReturnType<typeof vi.fn>
  let constructedWith: string[]
  let errorHandler: (() => void) | undefined

  beforeEach(() => {
    play = vi.fn().mockResolvedValue(undefined)
    addEventListener = vi.fn((event: string, handler: () => void) => {
      if (event === 'error') errorHandler = handler
    })
    constructedWith = []
    class MockAudio {
      constructor(src: string) {
        constructedWith.push(src)
      }
      play = play
      addEventListener = addEventListener
    }
    vi.stubGlobal('Audio', MockAudio)

    speak = vi.fn()
    cancel = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak, cancel })
    class MockUtterance {
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    errorHandler = undefined
  })

  it('plays the pre-recorded clip for the letter', () => {
    playLetter('C')

    expect(constructedWith).toEqual(['/audio/letters/C.mp3'])
    expect(play).toHaveBeenCalled()
    expect(speak).not.toHaveBeenCalled()
  })

  it('falls back to text-to-speech if the clip errors', () => {
    playLetter('H')

    errorHandler?.()

    expect(cancel).toHaveBeenCalled()
    expect(speak).toHaveBeenCalled()
  })

  it('falls back to text-to-speech if play() rejects', async () => {
    play.mockRejectedValue(new Error('not allowed'))

    playLetter('K')
    await Promise.resolve().then().then()

    expect(speak).toHaveBeenCalled()
  })
})
