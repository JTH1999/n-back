import clsx from 'clsx'
import { useDraftConfig } from '../hooks/useDraftConfig'
import type { Keymap } from '../config/keymap'
import type { ThemeOverride } from '../config/theme'
import type { StreamKind } from '../engine/streams'
import { ExportImportPanel } from './ExportImportPanel'
import { KeymapEditor } from './KeymapEditor'
import { Panel } from './Panel'
import { ScreenHeader } from './ScreenHeader'
import { SliderParam } from './SliderParam'
import { SubHeading } from './SubHeading'
import { ThemeToggle } from './ThemeToggle'
import { TwoColumnLayout } from './TwoColumnLayout'

export interface SettingsScreenProps {
  keymap: Keymap
  onRebindKey: (kind: StreamKind, key: string) => void
  themeOverride: ThemeOverride | null
  onChangeTheme: (theme: ThemeOverride | null) => void
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
      <ScreenHeader eyebrow="Preferences" title="Settings" />
      <TwoColumnLayout
        main={
          <>
            <Panel>
              <KeymapEditor keymap={keymap} onRebind={onRebindKey} />
            </Panel>
            <Panel>
              <fieldset className="flex flex-col gap-3">
                <SubHeading as="legend" className="mb-1">
                  Letter audio
                </SubHeading>
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
                <SliderParam
                  label="Volume"
                  ariaLabel="Volume"
                  valueLabel={`${Math.round(config.volume * 100)}%`}
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.volume}
                  disabled={config.muted}
                  onChange={(value) => setConfig({ ...config, volume: value })}
                />
              </fieldset>
            </Panel>
          </>
        }
        side={
          <>
            <Panel>
              <ThemeToggle override={themeOverride} onChange={onChangeTheme} />
            </Panel>
            <Panel>
              <ExportImportPanel />
            </Panel>
          </>
        }
      />
    </section>
  )
}
