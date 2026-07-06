import type { Letter } from '../engine/streams'

const letterClipPath = (letter: Letter) => `/audio/letters/${letter}.wav`

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
