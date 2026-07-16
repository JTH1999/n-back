import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { summarizePresetConfig } from '../config/presetSummary'
import { isPresetConfigEqual, usePresets } from '../hooks/usePresets'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import { Button } from './Button'
import { PresetList } from './PresetList'
import { PresetLoadConfirmDialog } from './PresetLoadConfirmDialog'
import { SavePresetPanel } from './SavePresetPanel'

export interface PresetPickerProps {
  config: SessionRunnerConfig
  setConfig: Dispatch<SetStateAction<SessionRunnerConfig>>
}

export function PresetPicker({ config, setConfig }: PresetPickerProps) {
  const { presets, activePresetId, savePreset, loadPreset } = usePresets()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null)
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
  const pendingPreset = presets.find((preset) => preset.id === pendingPresetId)
  const isModified = activePreset ? !isPresetConfigEqual(config, activePreset.config) : false

  const performLoad = (id: string) => {
    const preset = loadPreset(id)
    if (!preset) return
    setConfig((current) => ({ ...current, ...preset.config }))
    setIsOpen(false)
    setPendingPresetId(null)
  }

  const handleLoadRequest = (id: string) => {
    if (isModified) {
      setPendingPresetId(id)
      return
    }
    performLoad(id)
  }

  const handleSave = (name: string) => {
    savePreset(name, config)
  }

  const handleSaveAsNewAndLoad = (name: string) => {
    if (!pendingPresetId) return
    savePreset(name, config)
    performLoad(pendingPresetId)
  }

  const handleDiscardAndLoad = () => {
    if (!pendingPresetId) return
    performLoad(pendingPresetId)
  }

  const handleCancelLoad = () => {
    setPendingPresetId(null)
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
        {activePreset ? activePreset.name : 'No preset'}
        {isModified && (
          <span aria-label="modified" className="ml-1 text-accent">
            •
          </span>
        )}{' '}
        ▾
      </Button>
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-10 flex flex-col gap-4 p-4 w-80 rounded-xl border border-border bg-panel">
          <PresetList
            presets={presets}
            activePresetId={activePresetId}
            isActiveModified={isModified}
            onLoad={handleLoadRequest}
          />
          <SavePresetPanel currentSummary={summarizePresetConfig(config)} onSave={handleSave} />
        </div>
      )}
      {pendingPreset && (
        <PresetLoadConfirmDialog
          targetPresetName={pendingPreset.name}
          onSaveAsNewAndLoad={handleSaveAsNewAndLoad}
          onDiscardAndLoad={handleDiscardAndLoad}
          onCancel={handleCancelLoad}
        />
      )}
    </div>
  )
}
