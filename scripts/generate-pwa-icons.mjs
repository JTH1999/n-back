// One-off generator for PWA icon PNGs from the app's grid glyph.
// Run with: npm i -D sharp && node scripts/generate-pwa-icons.mjs
// sharp isn't a project dependency — install it temporarily to regenerate.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const BG = '#f2f5f6'
const CELL = '#c3ccd2'
const ACTIVE = '#56b4e9'

// Renders the 3x3 grid glyph (matching public/favicon.svg) inside a square
// canvas of `size`, inset by `padding` on each side, on a solid background —
// maskable icons need that inset so the glyph survives platform masking.
function gridIconSvg(size, padding, background) {
  const inner = size - padding * 2
  const cell = inner / 3.4
  const gap = (inner - cell * 3) / 2
  const rects = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const isActive = row === 1 && col === 1
      const x = padding + col * (cell + gap)
      const y = padding + row * (cell + gap)
      rects.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${cell * 0.22}" fill="${isActive ? ACTIVE : CELL}" />`,
      )
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${background}" />
    ${rects.join('\n')}
  </svg>`
}

mkdirSync('public/icons', { recursive: true })

const targets = [
  { file: 'public/icons/pwa-192.png', size: 192, padding: 24, background: BG },
  { file: 'public/icons/pwa-512.png', size: 512, padding: 64, background: BG },
  // Maskable icons are cropped to a circle by the OS, so the glyph needs a
  // much bigger inset to stay inside that safe zone.
  { file: 'public/icons/pwa-maskable-512.png', size: 512, padding: 128, background: BG },
  { file: 'public/icons/apple-touch-icon.png', size: 180, padding: 20, background: BG },
]

for (const { file, size, padding, background } of targets) {
  await sharp(Buffer.from(gridIconSvg(size, padding, background)))
    .png()
    .toFile(file)
  console.log(`wrote ${file}`)
}
