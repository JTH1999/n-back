import { LETTER_VALUES, type Letter } from '../engine/streams'

const letterClipPath = (letter: Letter) => `${import.meta.env.BASE_URL}audio/letters/${letter}.wav`

type AudioContextCtor = typeof AudioContext

function resolveAudioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined
  return window.AudioContext ?? (window as typeof window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  const Ctor = resolveAudioContextCtor()
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  return audioContext
}

// One decoded buffer per letter, shared across every play — decoding a clip
// is far slower than playing it, so it must happen at most once per letter.
const bufferCache = new Map<Letter, AudioBuffer>()
const loadPromises = new Map<Letter, Promise<AudioBuffer | null>>()

async function loadBuffer(letter: Letter, ctx: AudioContext): Promise<AudioBuffer | null> {
  if (typeof fetch === 'undefined') return null
  try {
    const response = await fetch(letterClipPath(letter))
    const arrayBuffer = await response.arrayBuffer()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    bufferCache.set(letter, buffer)
    return buffer
  } catch {
    return null
  }
}

function ensureLoaded(letter: Letter): void {
  if (bufferCache.has(letter) || loadPromises.has(letter)) return
  const ctx = getAudioContext()
  if (!ctx) return
  loadPromises.set(letter, loadBuffer(letter, ctx))
}

// Kicks off decoding for every letter up front (e.g. as soon as the app
// loads), so by the time a session starts, playback reads from memory
// instead of racing a fetch + decode.
export function preloadLetterAudio(): void {
  for (const letter of LETTER_VALUES) ensureLoaded(letter)
}

// Browsers suspend a freshly created AudioContext until a user gesture
// resumes it. Call this synchronously from the gesture handler that starts
// a session so the very first letter isn't the one that gets dropped.
export function unlockAudio(): void {
  const ctx = getAudioContext()
  if (ctx?.state === 'suspended') void ctx.resume()
}

function speakLetter(letter: Letter, volume: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(letter)
  utterance.volume = volume
  window.speechSynthesis.speak(utterance)
}

export function playLetter(letter: Letter, volume = 1, muted = false): void {
  if (muted) return

  const ctx = getAudioContext()
  const buffer = ctx ? bufferCache.get(letter) : undefined

  if (!ctx || !buffer) {
    // Not decoded yet (still loading, or the clip failed) — speak it now so
    // nothing plays silently, and make sure loading is under way for next time.
    ensureLoaded(letter)
    speakLetter(letter, volume)
    return
  }

  // A fresh node per play: independent of any previous or concurrent
  // playback of the same letter, so rapid or overlapping trials never
  // interrupt or silently drop each other.
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}
