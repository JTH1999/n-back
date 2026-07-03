import type { Letter } from '../engine/streams'

export function playLetter(letter: Letter): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(letter))
}
