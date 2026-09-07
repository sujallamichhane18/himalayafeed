import { describe, it, expect } from 'vitest'
import { feeds } from './Feeds'
import { DATA_RAMP, INDICATOR_ACCENT } from '../utils'

/**
 * Every manifest row quotes the size of the file it links to, read out of
 * stats.json by `statKey`. A typo there renders a blank count instead of a
 * number, silently, so the keys are pinned to the ones stats.json publishes.
 */
describe('feed manifest rows', () => {
  const STAT_KEYS = [
    'total_unique_ips',
    'total_unique_domains',
    'total_unique_hashes',
    'total_unique_urls',
    'total_unique_ipv6',
    'total_unique_cidrs',
  ]

  it('points every row at a published stats key', () => {
    for (const f of feeds) {
      expect(STAT_KEYS).toContain(f.statKey)
    }
  })

  it('lists each file and each stats key once', () => {
    expect(new Set(feeds.map((f) => f.file)).size).toBe(feeds.length)
    expect(new Set(feeds.map((f) => f.statKey)).size).toBe(feeds.length)
  })
})

describe('accent lock', () => {
  it('draws every feed accent from the shared ramp', () => {
    for (const f of feeds) {
      expect(DATA_RAMP).toContain(f.accent)
    }
  })

  it('gives each indicator type a distinct accent', () => {
    const used = Object.values(INDICATOR_ACCENT)
    expect(new Set(used).size).toBe(used.length)
  })

  it('carries no off-palette hue (no AI-purple, cyan, emerald, or indigo)', () => {
    const banned = ['#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f97316']
    for (const c of DATA_RAMP) {
      expect(banned).not.toContain(c.toLowerCase())
    }
  })
})
