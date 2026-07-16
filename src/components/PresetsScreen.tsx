import type { Dispatch, SetStateAction } from 'react'
import { usePresets } from '../hooks/usePresets'
import { summarizePresetConfig } from '../config/presetSummary'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import { PresetList } from './PresetList'
import { SavePresetPanel } from './SavePresetPanel'
import { ScreenHeader } from './ScreenHeader'
import { TwoColumnLayout } from './TwoColumnLayout'

export interface PresetsScreenProps {
  config: SessionRunnerConfig
  setConfig: Dispatch<SetStateAction<SessionRunnerConfig>>
}

export function PresetsScreen({ config, setConfig }: PresetsScreenProps) {
  const { presets, activePresetId, savePreset, loadPreset, deletePreset } = usePresets()

  const handleSavePreset = (name: string) => {
    savePreset(name, config)
  }

  const handleLoadPreset = (id: string) => {
    const preset = loadPreset(id)
    if (!preset) return
    setConfig((current) => ({ ...current, ...preset.config }))
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
