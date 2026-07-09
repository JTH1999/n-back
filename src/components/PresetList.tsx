import clsx from 'clsx'
import type { Preset } from '../adapters/usePresets'
import { summarizePresetConfig } from '../config/presetSummary'

export interface PresetListProps {
  presets: Preset[]
  activePresetId: string | null
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}

export function PresetList({ presets, activePresetId, onLoad, onDelete }: PresetListProps) {
  if (presets.length === 0) {
    return <p className="text-sm text-dim">No saved presets yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {presets.map((preset) => (
        <div
          key={preset.id}
          className={clsx(
            'flex items-center gap-3 rounded-xl border bg-panel p-[16px_18px]',
            preset.id === activePresetId ? 'border-accent' : 'border-border',
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold">
              {preset.name}
              {preset.id === activePresetId && (
                <span className="ml-2 font-mono text-[11px] tracking-[0.1em] text-accent uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="mt-[3px] truncate font-mono text-xs text-dim">
              {summarizePresetConfig(preset.config)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLoad(preset.id)}
              className="rounded-lg border border-border px-3 py-2 font-mono text-[13px] hover:border-dim"
            >
              Load
            </button>
            <button
              type="button"
              aria-label={`Delete ${preset.name}`}
              onClick={() => onDelete(preset.id)}
              className="rounded-md p-2 text-dim hover:bg-panel2 hover:text-danger"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
