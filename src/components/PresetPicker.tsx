import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { summarizePresetConfig } from '../config/presetSummary'
import { isPresetConfigEqual, usePresets } from '../hooks/usePresets'
import type { SessionRunnerConfig } from '../hooks/useSessionRunner'
import { Button } from './Button'
import { ManagePresetsModal } from './ManagePresetsModal'
import { PresetList } from './PresetList'
import { PresetLoadConfirmDialog } from './PresetLoadConfirmDialog'
import { SavePresetPanel } from './SavePresetPanel'

const VIEWPORT_EDGE_MARGIN_PX = 16

export interface PresetPickerProps {
  config: SessionRunnerConfig
  setConfig: Dispatch<SetStateAction<SessionRunnerConfig>>
}

export function PresetPicker({ config, setConfig }: PresetPickerProps) {
  const { presets, activePresetId, savePreset, loadPreset, renamePreset, deletePreset } = usePresets()
  const [isOpen, setIsOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null)
  const [panelOffsetX, setPanelOffsetX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelOffsetX(0)
      return
    }

    function handleResize() {
      const container = containerRef.current
      const panel = panelRef.current
      if (!container || !panel) return

      const containerRight = container.getBoundingClientRect().right
      const panelWidth = panel.offsetWidth
      const naturalLeft = containerRight - panelWidth
      const minLeft = VIEWPORT_EDGE_MARGIN_PX
      const maxLeft = window.innerWidth - VIEWPORT_EDGE_MARGIN_PX - panelWidth
      const clampedLeft = Math.min(Math.max(naturalLeft, minLeft), maxLeft)
      setPanelOffsetX(clampedLeft - naturalLeft)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
    setIsManageOpen(false)
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

  const handleOpenManagePresets = () => {
    setIsOpen(false)
    setIsManageOpen(true)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="bg-panel font-mono"
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
        <div
          ref={panelRef}
          style={panelOffsetX !== 0 ? { transform: `translateX(${panelOffsetX}px)` } : undefined}
          className="absolute top-[calc(100%+8px)] right-0 z-10 flex flex-col gap-4 p-4 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-panel shadow-lg"
        >
          <PresetList
            presets={presets}
            activePresetId={activePresetId}
            isActiveModified={isModified}
            onLoad={handleLoadRequest}
          />
          <SavePresetPanel currentSummary={summarizePresetConfig(config)} onSave={handleSave} />
          <Button variant="ghost" onClick={handleOpenManagePresets}>
            Manage presets…
          </Button>
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
      {isManageOpen && (
        <ManagePresetsModal
          presets={presets}
          activePresetId={activePresetId}
          isActiveModified={isModified}
          onLoad={handleLoadRequest}
          onRename={renamePreset}
          onDelete={deletePreset}
          onClose={() => setIsManageOpen(false)}
        />
      )}
    </div>
  )
}
