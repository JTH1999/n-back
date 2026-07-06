# Letter audio clips

Pre-recorded audio clips for the Letter stream, one file per letter in the
default set (C, H, K, L, Q, R, S, T), named `<LETTER>.wav` (e.g. `C.wav`).

`playLetter` (`src/audio/letterAudio.ts`) falls back to browser
text-to-speech only if a clip fails to load or play.
