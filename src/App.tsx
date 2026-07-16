import { useEffect, useMemo, useState } from 'react'
import { preloadLetterAudio } from './audio/letterAudio'
import { useAccent } from './hooks/useAccent'
import { useDraftConfig } from './hooks/useDraftConfig'
import { useKeymap } from './hooks/useKeymap'
import type { SessionRunnerConfig } from './hooks/useSessionRunner'
import { useTheme } from './hooks/useTheme'
import { AppShell, type NavItem } from './components/AppShell'
import { ConfigForm } from './components/ConfigForm'
import { HistoryView } from './components/HistoryView'
import { PresetsScreen } from './components/PresetsScreen'
import { SessionRunner } from './components/SessionRunner'
import { SettingsScreen } from './components/SettingsScreen'
import { computeStreakStats } from './derived/streakStats'
import { loadHistory, type SessionHistoryRecord } from './persistence/historyStorage'

type Screen = 'train' | 'history' | 'presets' | 'settings'

const NAV_ITEMS: NavItem<Screen>[] = [
  { id: 'train', label: 'Train' },
  { id: 'history', label: 'History' },
  { id: 'presets', label: 'Presets' },
  { id: 'settings', label: 'Settings' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('train')
  const [activeConfig, setActiveConfig] = useState<SessionRunnerConfig | null>(null)
  const [history, setHistory] = useState<SessionHistoryRecord[]>(() => loadHistory())
  const [draftConfig, setDraftConfig] = useDraftConfig()
  const { keymap, rebind } = useKeymap()
  const { override: themeOverride, setOverride: setThemeOverride } = useTheme()
  const { accent, setAccent } = useAccent()
  const streak = useMemo(() => computeStreakStats(history), [history])

  useEffect(() => {
    preloadLetterAudio()
  }, [])

  return (
    <AppShell navItems={NAV_ITEMS} activeId={screen} onNavigate={setScreen} streak={streak}>
      {activeConfig ? (
        <SessionRunner
          config={activeConfig}
          keymap={keymap}
          onRestart={() => setActiveConfig(null)}
          onSessionComplete={() => setHistory(loadHistory())}
          isFocused={screen === 'train'}
        />
      ) : (
        screen === 'train' && (
          <ConfigForm config={draftConfig} setConfig={setDraftConfig} onStart={setActiveConfig} />
        )
      )}
      {screen === 'presets' && (
        <PresetsScreen config={draftConfig} setConfig={setDraftConfig} />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          config={draftConfig}
          setConfig={setDraftConfig}
          keymap={keymap}
          onRebindKey={rebind}
          themeOverride={themeOverride}
          onChangeTheme={setThemeOverride}
          accent={accent}
          onChangeAccent={setAccent}
        />
      )}
      {screen === 'history' && <HistoryView />}
    </AppShell>
  )
}

export default App
