import { useDraftConfig } from '../hooks/useDraftConfig'
import { usePresets } from '../hooks/usePresets'
import type { Keymap } from '../config/keymap'
import { summarizePresetConfig } from '../config/presetSummary'
import { PresetList } from './PresetList'
import { SavePresetPanel } from './SavePresetPanel'
import { ScreenHeader } from './ScreenHeader'
import { TwoColumnLayout } from './TwoColumnLayout'

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
      <ScreenHeader eyebrow="Saved setups" title="Presets" />
      <TwoColumnLayout
        main={
          <PresetList
            presets={presets}
            activePresetId={activePresetId}
            onLoad={handleLoadPreset}
            onDelete={deletePreset}
          />
        }
        side={
          <SavePresetPanel currentSummary={summarizePresetConfig(config)} onSave={handleSavePreset} />
        }
      />
    </section>
  )
}
