import { useDraftConfig } from '../adapters/useDraftConfig'
import { usePresets } from '../adapters/usePresets'
import type { Keymap } from '../config/keymap'
import { summarizePresetConfig } from '../config/presetSummary'
import { PresetList } from './PresetList'
import { SavePresetPanel } from './SavePresetPanel'

export interface PresetsScreenProps {
  keymap: Keymap
  onApplyKeymap: (keymap: Keymap) => void
}

export function PresetsScreen({ keymap, onApplyKeymap }: PresetsScreenProps) {
  const [config, setConfig] = useDraftConfig()
  const { presets, activePresetId, savePreset, loadPreset, deletePreset } = usePresets()

  const handleSavePreset = (name: string) => {
    savePreset(name, config, keymap)
  }

  const handleLoadPreset = (id: string) => {
    const preset = loadPreset(id)
    if (!preset) return
    setConfig(preset.config)
    onApplyKeymap(preset.keymap)
  }

  return (
    <section className="flex flex-col gap-7">
      <header className="flex flex-col gap-0.5">
        <span className="font-mono text-[11px] tracking-[0.2em] text-dim uppercase">
          Saved setups
        </span>
        <h1 className="text-[22px] font-semibold">Presets</h1>
      </header>
      <div className="flex flex-col items-stretch gap-5 shell:flex-row shell:items-start">
        <div className="min-w-0 flex-1">
          <PresetList
            presets={presets}
            activePresetId={activePresetId}
            onLoad={handleLoadPreset}
            onDelete={deletePreset}
          />
        </div>
        <div className="shell:w-[290px] shell:flex-none">
          <SavePresetPanel
            currentSummary={summarizePresetConfig(config)}
            onSave={handleSavePreset}
          />
        </div>
      </div>
    </section>
  )
}
