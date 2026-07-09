import { useState } from 'react'
import { useKeymap } from './adapters/useKeymap'
import type { SessionRunnerConfig } from './adapters/useSessionRunner'
import { useTheme } from './adapters/useTheme'
import { ConfigForm } from './components/ConfigForm'
import { HistoryView } from './components/HistoryView'
import { SessionRunner } from './components/SessionRunner'

function App() {
  const [config, setConfig] = useState<SessionRunnerConfig | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const { keymap, rebind, setKeymap } = useKeymap()
  const { override: themeOverride, resolvedTheme, setOverride: setThemeOverride } = useTheme()

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <h1 className="text-3xl font-bold">N-Back Trainer</h1>
      {config ? (
        <SessionRunner config={config} keymap={keymap} onRestart={() => setConfig(null)} />
      ) : showHistory ? (
        <HistoryView onBack={() => setShowHistory(false)} resolvedTheme={resolvedTheme} />
      ) : (
        <>
          <ConfigForm
            onStart={setConfig}
            keymap={keymap}
            onRebindKey={rebind}
            onApplyKeymap={setKeymap}
            themeOverride={themeOverride}
            onChangeTheme={setThemeOverride}
          />
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="text-sm text-slate-500 underline dark:text-slate-400"
          >
            View history
          </button>
        </>
      )}
    </main>
  )
}

export default App
