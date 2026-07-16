import type { Preset } from '../hooks/usePresets'
import { Button } from './Button'
import { Overlay } from './Overlay'
import { PresetList } from './PresetList'

export interface ManagePresetsModalProps {
  presets: Preset[]
  activePresetId: string | null
  isActiveModified?: boolean
  onLoad: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function ManagePresetsModal({
  presets,
  activePresetId,
  isActiveModified,
  onLoad,
  onRename,
  onDelete,
  onClose,
}: ManagePresetsModalProps) {
  return (
    <Overlay
      role="dialog"
      ariaLabel="Manage presets"
      panelClassName="flex max-h-[80vh] w-full max-w-[480px] flex-col gap-4 rounded-2xl border border-border bg-panel p-6 text-left"
    >
      <div className="flex w-full items-center justify-between">
        <h2 className="text-[20px] font-semibold">Manage presets</h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="overflow-y-auto">
        <PresetList
          presets={presets}
          activePresetId={activePresetId}
          isActiveModified={isActiveModified}
          onLoad={onLoad}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </Overlay>
  )
}
