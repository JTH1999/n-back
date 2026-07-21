export type ThemeOverride = 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export type AccentColor = 'teal' | 'blue' | 'purple' | 'rose' | 'amber'

export const ACCENT_COLORS: AccentColor[] = ['teal', 'blue', 'purple', 'rose', 'amber']

export const DEFAULT_ACCENT: AccentColor = 'teal'

// Mirrors --bg from src/index.css for each theme — used to keep the
// browser/OS chrome (the "theme-color" meta tag) in sync with the app background.
export const BACKGROUND_COLOR: Record<ResolvedTheme, string> = {
  light: '#f2f5f6',
  dark: '#15181b',
}
