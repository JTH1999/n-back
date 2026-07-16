import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { summarizePresetConfig } from '../config/presetSummary'
import { usePresets } from '../hooks/usePresets'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import { Button } from './Button'
import { PresetList } from './PresetList'
import { SavePresetPanel } from './SavePresetPanel'

export interface PresetPickerProps {
  config: SessionRunnerConfig
  setConfig: Dispatch<SetStateAction<SessionRunnerConfig>>
}

export function PresetPicker({ config, setConfig }: PresetPickerProps) {
  const { presets, activePresetId, savePreset, loadPreset } = usePresets()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  const activePreset = presets.find((preset) => preset.id === activePresetId)

  const handleLoad = (id: string) => {
    const preset = loadPreset(id)
    if (!preset) return
    setConfig((current) => ({ ...current, ...preset.config }))
    setIsOpen(false)
  }

  const handleSave = (name: string) => {
    savePreset(name, config)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="font-mono"
      >
        {activePreset ? activePreset.name : 'No preset'} ▾
      </Button>
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-10 flex flex-col gap-4 p-4 w-80 rounded-xl border border-border bg-panel shadow-lg">
          <PresetList presets={presets} activePresetId={activePresetId} onLoad={handleLoad} />
          <SavePresetPanel currentSummary={summarizePresetConfig(config)} onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
