import type { Letter } from '../engine/streams'

const letterClipPath = (letter: Letter) => `${import.meta.env.BASE_URL}audio/letters/${letter}.wav`

function speakLetter(letter: Letter, volume: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(letter)
  utterance.volume = volume
  window.speechSynthesis.speak(utterance)
}

export function playLetter(letter: Letter, volume = 1, muted = false): void {
  if (muted) return
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return

  const clip = new Audio(letterClipPath(letter))
  clip.volume = volume
  clip.addEventListener('error', () => speakLetter(letter, volume))
  clip.play().catch(() => speakLetter(letter, volume))
}
