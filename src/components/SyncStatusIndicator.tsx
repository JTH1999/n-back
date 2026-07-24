import clsx from 'clsx'
import type { SyncStatus } from '../hooks/useSyncStatus'

const LABEL: Record<SyncStatus, string> = {
  synced: 'Synced',
  pending: 'Pending',
  'failed-retrying': 'Failed, retrying',
}

const DOT_COLOR: Record<SyncStatus, string> = {
  synced: 'bg-success',
  pending: 'bg-warning',
  'failed-retrying': 'bg-danger',
}

export interface SyncStatusIndicatorProps {
  status: SyncStatus
}

export function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-dim">
      <span aria-hidden="true" className={clsx('h-2 w-2 flex-none rounded-full', DOT_COLOR[status])} />
      {LABEL[status]}
    </p>
  )
}
