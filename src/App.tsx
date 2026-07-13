import { useState } from 'react'
import { useKeymap } from './hooks/useKeymap'
import type { SessionRunnerConfig } from './hooks/useSessionRunner'
import { useTheme } from './hooks/useTheme'
import { AppShell, type NavItem } from './components/AppShell'
import { ConfigForm } from './components/ConfigForm'
import { HistoryView } from './components/HistoryView'
import { PresetsScreen } from './components/PresetsScreen'
import { SessionRunner } from './components/SessionRunner'
import { SettingsScreen } from './components/SettingsScreen'

type Screen = 'train' | 'presets' | 'history' | 'settings'

const NAV_ITEMS: NavItem<Screen>[] = [
  { id: 'train', label: 'Train' },
  { id: 'presets', label: 'Presets' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('train')
  const [config, setConfig] = useState<SessionRunnerConfig | null>(null)
  const { keymap, rebind, setKeymap } = useKeymap()
  const { override: themeOverride, resolvedTheme, setOverride: setThemeOverride } = useTheme()

  return (
    <AppShell
      navItems={NAV_ITEMS}
      activeId={screen}
      onNavigate={setScreen}
      themeOverride={themeOverride}
      onChangeTheme={setThemeOverride}
    >
      {config ? (
        <SessionRunner
          config={config}
          keymap={keymap}
          onRestart={() => setConfig(null)}
          isFocused={screen === 'train'}
        />
      ) : (
        screen === 'train' && <ConfigForm onStart={setConfig} />
      )}
      {screen === 'presets' && <PresetsScreen keymap={keymap} onApplyKeymap={setKeymap} />}
      {screen === 'settings' && (
        <SettingsScreen
          keymap={keymap}
          onRebindKey={rebind}
          themeOverride={themeOverride}
          onChangeTheme={setThemeOverride}
        />
      )}
      {screen === 'history' && (
        <HistoryView onBack={() => setScreen('train')} resolvedTheme={resolvedTheme} />
      )}
    </AppShell>
  )
}

export default App
