# Letter audio clips

Pre-recorded audio clips for the Letter stream go here, one file per letter
in the default set (C, H, K, L, Q, R, S, T), named `<LETTER>.mp3`
(e.g. `C.mp3`).

Until real recordings are added, `playLetter` (`src/audio/letterAudio.ts`)
falls back to browser text-to-speech when a clip fails to load or play.
