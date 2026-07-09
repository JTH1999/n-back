import { useState } from 'react'
import { useKeymap } from './adapters/useKeymap'
import type { SessionRunnerConfig } from './adapters/useSessionRunner'
import { useTheme } from './adapters/useTheme'
import { AppShell, type NavItem } from './components/AppShell'
import { ConfigForm } from './components/ConfigForm'
import { HistoryView } from './components/HistoryView'
import { SessionRunner } from './components/SessionRunner'

type Screen = 'train' | 'history'

const NAV_ITEMS: NavItem<Screen>[] = [
  { id: 'train', label: 'Train' },
  { id: 'history', label: 'History' },
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
      {screen === 'train' ? (
        config ? (
          <SessionRunner config={config} keymap={keymap} onRestart={() => setConfig(null)} />
        ) : (
          <ConfigForm
            onStart={setConfig}
            keymap={keymap}
            onRebindKey={rebind}
            onApplyKeymap={setKeymap}
            themeOverride={themeOverride}
            onChangeTheme={setThemeOverride}
          />
        )
      ) : (
        <HistoryView onBack={() => setScreen('train')} resolvedTheme={resolvedTheme} />
      )}
    </AppShell>
  )
}

export default App
