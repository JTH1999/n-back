import type { ReactNode } from 'react'
import { useDraftConfig } from '../adapters/useDraftConfig'
import type { Keymap } from '../config/keymap'
import type { ThemeOverride } from '../config/theme'
import type { StreamKind } from '../engine/streams'
import { ExportImportPanel } from './ExportImportPanel'
import { FieldRow } from './FieldRow'
import { KeymapEditor } from './KeymapEditor'
import { ThemeToggle } from './ThemeToggle'

export interface SettingsScreenProps {
  keymap: Keymap
  onRebindKey: (kind: StreamKind, key: string) => void
  themeOverride: ThemeOverride | null
  onChangeTheme: (theme: ThemeOverride | null) => void
}

function SettingsPanel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-border bg-panel p-[18px]">{children}</div>
}

export function SettingsScreen({
  keymap,
  onRebindKey,
  themeOverride,
  onChangeTheme,
}: SettingsScreenProps) {
  const [config, setConfig] = useDraftConfig()

  return (
    <section className="flex flex-col gap-7">
      <header className="flex flex-col gap-0.5">
        <span className="font-mono text-[11px] tracking-[0.2em] text-dim uppercase">
          Preferences
        </span>
        <h1 className="text-[22px] font-semibold">Settings</h1>
      </header>
      <div className="flex flex-col items-stretch gap-4 shell:flex-row shell:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SettingsPanel>
            <KeymapEditor keymap={keymap} onRebind={onRebindKey} />
          </SettingsPanel>
          <SettingsPanel>
            <fieldset className="flex flex-col gap-2">
              <legend>Letter audio</legend>
              <FieldRow label="Volume">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.volume}
                  disabled={config.muted}
                  onChange={(event) => setConfig({ ...config, volume: Number(event.target.value) })}
                />
              </FieldRow>
              <FieldRow label="Mute">
                <input
                  type="checkbox"
                  checked={config.muted}
                  onChange={(event) => setConfig({ ...config, muted: event.target.checked })}
                />
              </FieldRow>
            </fieldset>
          </SettingsPanel>
        </div>
        <div className="flex flex-col gap-4 shell:w-[290px] shell:flex-none">
          <SettingsPanel>
            <ThemeToggle override={themeOverride} onChange={onChangeTheme} />
          </SettingsPanel>
          <SettingsPanel>
            <ExportImportPanel />
          </SettingsPanel>
        </div>
      </div>
    </section>
  )
}
