import { useDraftConfig } from '../adapters/useDraftConfig'
import { usePresets } from '../adapters/usePresets'
import type { Keymap } from '../config/keymap'
import { PresetManager } from './PresetManager'

export interface PresetsScreenProps {
  keymap: Keymap
  onApplyKeymap: (keymap: Keymap) => void
}

export function PresetsScreen({ keymap, onApplyKeymap }: PresetsScreenProps) {
  const [config, setConfig] = useDraftConfig()
  const { presets, activePresetId, savePreset, loadPreset } = usePresets()

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
      <div className="rounded-xl border border-border bg-panel p-[18px]">
        <PresetManager
          presets={presets}
          activePresetId={activePresetId}
          onSave={handleSavePreset}
          onLoad={handleLoadPreset}
        />
      </div>
    </section>
  )
}
