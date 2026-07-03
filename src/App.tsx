import { useState } from 'react'
import type { SessionRunnerConfig } from './adapters/useSessionRunner'
import { ConfigForm } from './components/ConfigForm'
import { SessionRunner } from './components/SessionRunner'

function App() {
  const [config, setConfig] = useState<SessionRunnerConfig | null>(null)

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-3xl font-bold">N-Back Trainer</h1>
      {config ? (
        <SessionRunner config={config} onRestart={() => setConfig(null)} />
      ) : (
        <ConfigForm onStart={setConfig} />
      )}
    </main>
  )
}

export default App
