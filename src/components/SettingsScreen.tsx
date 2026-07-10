import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useDraftConfig } from '../adapters/useDraftConfig'
import type { Keymap } from '../config/keymap'
import type { ThemeOverride } from '../config/theme'
import type { StreamKind } from '../engine/streams'
import { EYEBROW_CLASS, RANGE_INPUT_CLASS } from '../styles/controls'
import { ExportImportPanel } from './ExportImportPanel'
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
            <fieldset className="flex flex-col gap-3">
              <legend className={clsx(EYEBROW_CLASS, 'mb-1')}>Letter audio</legend>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!config.muted}
                  aria-label="Mute"
                  onClick={() => setConfig({ ...config, muted: !config.muted })}
                  className={clsx(
                    'relative h-6 w-[42px] flex-none rounded-full transition-colors',
                    config.muted ? 'bg-border' : 'bg-accent',
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform',
                      !config.muted && 'translate-x-[18px]',
                    )}
                  />
                </button>
                <span className="text-sm font-medium">{config.muted ? 'Muted' : 'Unmuted'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  type="range"
                  aria-label="Volume"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.volume}
                  disabled={config.muted}
                  onChange={(event) => setConfig({ ...config, volume: Number(event.target.value) })}
                  className={RANGE_INPUT_CLASS}
                />
                <span className="font-mono text-xs text-dim">
                  volume · {Math.round(config.volume * 100)}%
                </span>
              </div>
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
