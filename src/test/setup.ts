import '@testing-library/jest-dom/vitest'

// jsdom has no layout engine, so recharts' ResponsiveContainer never sees a
// non-zero size and renders nothing. Stub a ResizeObserver that reports back
// a fixed size synchronously, matching how recharts reads it in real browsers.
class ResizeObserverStub implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback([{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry], this)
  }

  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverStub

// Only the ResponsiveContainer's own wrapper needs a non-zero size — leaving
// everything else at jsdom's default (all zeros) keeps recharts' internal
// measurements (e.g. the legend's own height) behaving as they did before.
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect
Element.prototype.getBoundingClientRect = function stubbedGetBoundingClientRect(this: Element) {
  if (this.classList.contains('recharts-responsive-container')) {
    return { width: 600, height: 240, top: 0, left: 0, bottom: 240, right: 600, x: 0, y: 0, toJSON() {} }
  }
  return originalGetBoundingClientRect.call(this)
}
