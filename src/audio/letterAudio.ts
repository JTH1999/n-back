import type { Letter } from '../engine/streams'

// Pre-recorded clips belong here, one file per letter (e.g. /audio/letters/C.mp3).
// TODO: record and add the actual clips — until then, playback falls back to TTS.
const letterClipPath = (letter: Letter) => `/audio/letters/${letter}.mp3`

function speakLetter(letter: Letter): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(letter))
}

export function playLetter(letter: Letter): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return

  const clip = new Audio(letterClipPath(letter))
  clip.addEventListener('error', () => speakLetter(letter))
  clip.play().catch(() => speakLetter(letter))
}
