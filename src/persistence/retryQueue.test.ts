import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRetryQueue } from './retryQueue'

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
}

beforeEach(() => {
  window.localStorage.clear()
  setOnline(true)
})

afterEach(() => {
  vi.useRealTimers()
  setOnline(true)
})

describe('createRetryQueue', () => {
  it('reports idle status with nothing queued', () => {
    const queue = createRetryQueue<string>({
      storageKey: 'test-queue-idle',
      getId: (item) => item,
      execute: vi.fn().mockResolvedValue(undefined),
    })

    expect(queue.getStatus()).toBe('idle')
  })

  it('reports pending status and removes the item once it pushes successfully', async () => {
    const execute = vi.fn().mockResolvedValue(undefined)
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-success', getId: (item) => item, execute })

    await queue.push('item-1')

    expect(execute).toHaveBeenCalledWith('item-1')
    expect(queue.getStatus()).toBe('idle')
  })

  it('keeps a failed item queued and reports retrying status', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('network down'))
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-fail', getId: (item) => item, execute })

    await queue.push('item-1')

    expect(queue.getStatus()).toBe('retrying')
    queue.clear()
  })

  it('reports pending (not retrying) status while offline and never even attempts a push', async () => {
    setOnline(false)
    const execute = vi.fn().mockResolvedValue(undefined)
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-offline', getId: (item) => item, execute })

    await queue.push('item-1')

    expect(execute).not.toHaveBeenCalled()
    expect(queue.getStatus()).toBe('pending')
  })

  it('retries a failed item with exponential backoff', async () => {
    vi.useFakeTimers()
    const execute = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined)
    const queue = createRetryQueue<string>({
      storageKey: 'test-queue-backoff',
      getId: (item) => item,
      execute,
      baseDelayMs: 1000,
    })

    await queue.push('item-1')
    expect(execute).toHaveBeenCalledTimes(1)
    expect(queue.getStatus()).toBe('retrying')

    await vi.advanceTimersByTimeAsync(999)
    expect(execute).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(execute).toHaveBeenCalledTimes(2)
    expect(queue.getStatus()).toBe('idle')
  })

  it('bases the retry delay on the least-retried item, not the most', async () => {
    vi.useFakeTimers()
    const execute = vi.fn().mockRejectedValue(new Error('boom'))
    const queue = createRetryQueue<string>({
      storageKey: 'test-queue-min-backoff',
      getId: (item) => item,
      execute,
      baseDelayMs: 1000,
    })

    await queue.push('old')
    expect(execute).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(execute).toHaveBeenCalledTimes(2) // 'old' has now failed twice (attempts=2)

    await queue.push('new')
    expect(execute).toHaveBeenCalledTimes(4) // pushing attempts the whole queue immediately

    await vi.advanceTimersByTimeAsync(999)
    expect(execute).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(1)
    // 'new' has only failed once, so the next retry follows its shorter
    // backoff (1000ms) rather than 'old's longer one (2000ms).
    expect(execute).toHaveBeenCalledTimes(6)

    queue.clear()
  })

  it('replaces a queued item with the same id rather than duplicating it', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('boom'))
    const queue = createRetryQueue<{ id: string; value: string }>({
      storageKey: 'test-queue-dedupe',
      getId: (item) => item.id,
      execute,
    })

    await queue.push({ id: 'a', value: 'first' })
    await queue.push({ id: 'a', value: 'second' })

    expect(execute).toHaveBeenLastCalledWith({ id: 'a', value: 'second' })
    expect(execute).toHaveBeenCalledTimes(2)
    queue.clear()
  })

  it('flushes immediately when the online event fires', async () => {
    setOnline(false)
    const execute = vi.fn().mockResolvedValue(undefined)
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-online-event', getId: (item) => item, execute })

    await queue.push('item-1')
    expect(execute).not.toHaveBeenCalled()

    setOnline(true)
    window.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(queue.getStatus()).toBe('idle'))
    expect(execute).toHaveBeenCalledWith('item-1')
  })

  it('persists queued items across reconstruction, so a reload does not lose them', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('boom'))
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-persist', getId: (item) => item, execute })
    await queue.push('item-1')

    const rebuilt = createRetryQueue<string>({
      storageKey: 'test-queue-persist',
      getId: (item) => item,
      execute: vi.fn().mockResolvedValue(undefined),
    })

    expect(rebuilt.getStatus()).not.toBe('idle')
    queue.clear()
    rebuilt.clear()
  })

  it('clears queued items and stops retrying', async () => {
    vi.useFakeTimers()
    const execute = vi.fn().mockRejectedValue(new Error('boom'))
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-clear', getId: (item) => item, execute })
    await queue.push('item-1')
    expect(queue.getStatus()).toBe('retrying')

    queue.clear()
    expect(queue.getStatus()).toBe('idle')

    await vi.advanceTimersByTimeAsync(60_000)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('does not drop an item pushed while another item is mid-attempt', async () => {
    let resolveFirst: (() => void) | undefined
    const execute = vi.fn().mockImplementation((item: string) => {
      if (item === 'item-1') return new Promise<void>((resolve) => (resolveFirst = resolve))
      return Promise.resolve()
    })
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-concurrent', getId: (item) => item, execute })

    const firstPush = queue.push('item-1')
    await Promise.resolve()
    const secondPush = queue.push('item-2')
    await Promise.resolve()

    expect(execute).not.toHaveBeenCalledWith('item-2')

    resolveFirst?.()
    await firstPush
    await secondPush

    expect(execute).toHaveBeenCalledWith('item-2')
    expect(queue.getStatus()).toBe('idle')
  })

  it('notifies subscribers when status changes', async () => {
    const execute = vi.fn().mockResolvedValue(undefined)
    const queue = createRetryQueue<string>({ storageKey: 'test-queue-subscribe', getId: (item) => item, execute })
    const listener = vi.fn()
    const unsubscribe = queue.subscribe(listener)

    await queue.push('item-1')
    expect(listener).toHaveBeenCalled()

    listener.mockClear()
    unsubscribe()
    await queue.push('item-2')
    expect(listener).not.toHaveBeenCalled()
  })
})
