// A small persisted retry queue: items that fail to push are kept (in
// localStorage, so a reload doesn't lose them) and retried with exponential
// backoff, immediately on `online`, until they succeed.

export type QueueStatus = 'idle' | 'pending' | 'retrying'

interface QueuedItem<T> {
  item: T
  attempts: number
}

export interface RetryQueue<T> {
  // Enqueues the item (replacing any queued item with the same id) and
  // attempts to flush the whole queue immediately. Never rejects.
  push(item: T): Promise<void>
  getStatus(): QueueStatus
  subscribe(listener: () => void): () => void
  clear(): void
}

export interface RetryQueueOptions<T> {
  storageKey: string
  getId: (item: T) => string
  execute: (item: T) => Promise<void>
  baseDelayMs?: number
  maxDelayMs?: number
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

function loadPersisted<T>(storageKey: string): QueuedItem<T>[] {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as QueuedItem<T>[]) : []
  } catch {
    return []
  }
}

export function createRetryQueue<T>(options: RetryQueueOptions<T>): RetryQueue<T> {
  const { storageKey, getId, execute, baseDelayMs = 1000, maxDelayMs = 30_000 } = options

  let items: QueuedItem<T>[] = loadPersisted<T>(storageKey)
  let timer: ReturnType<typeof setTimeout> | null = null
  let flushingPromise: Promise<void> | null = null
  let rerunRequested = false
  const listeners = new Set<() => void>()

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {
      // best-effort — an in-memory retry is still better than nothing
    }
  }

  function notify() {
    for (const listener of listeners) listener()
  }

  function cancelTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleRetry(delayMs: number) {
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      void flush()
    }, delayMs)
  }

  async function attempt(queued: QueuedItem<T>): Promise<boolean> {
    try {
      await execute(queued.item)
      return true
    } catch {
      return false
    }
  }

  // Runs one attempt pass over whatever was queued when it started, then
  // reconciles the outcome back into the *current* queue (rather than
  // overwriting it outright) so an item pushed mid-pass — while an earlier
  // item's attempt is in flight — is never dropped on the floor.
  async function runFlush(): Promise<void> {
    cancelTimer()
    if (!isOnline() || items.length === 0) return

    const snapshot = items
    const outcomes = new Map<string, boolean>()
    for (const queued of snapshot) {
      outcomes.set(getId(queued.item), await attempt(queued))
    }

    items = items.flatMap((queued) => {
      const id = getId(queued.item)
      if (!outcomes.has(id)) return [queued]
      return outcomes.get(id) ? [] : [{ item: queued.item, attempts: queued.attempts + 1 }]
    })
    persist()
    notify()

    if (items.length > 0) {
      // Base the delay on the least-retried item, not the most: a freshly
      // failed item queued alongside one that's failed many times shouldn't
      // inherit the older item's much longer backoff before its own next try.
      const minAttempts = Math.min(...items.map((queued) => queued.attempts))
      scheduleRetry(Math.min(baseDelayMs * 2 ** (minAttempts - 1), maxDelayMs))
    }
  }

  function flush(): Promise<void> {
    if (flushingPromise) {
      rerunRequested = true
      return flushingPromise
    }
    flushingPromise = (async () => {
      do {
        rerunRequested = false
        await runFlush()
      } while (rerunRequested)
    })().finally(() => {
      flushingPromise = null
    })
    return flushingPromise
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => void flush())
  }

  // Retry anything left over from a previous page load, once online.
  void flush()

  return {
    async push(item: T) {
      const id = getId(item)
      items = [...items.filter((queued) => getId(queued.item) !== id), { item, attempts: 0 }]
      persist()
      notify()
      await flush()
    },
    getStatus(): QueueStatus {
      if (items.length === 0) return 'idle'
      return items.some((queued) => queued.attempts > 0) ? 'retrying' : 'pending'
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    clear() {
      items = []
      cancelTimer()
      persist()
      notify()
    },
  }
}
