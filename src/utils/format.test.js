import { describe, it, expect } from 'vitest'
import { initials, formatDate, timeAgo, categoryColor } from './format'

describe('initials', () => {
  it('builds initials from first and last name', () => { expect(initials('Ramya B')).toBe('RB') })
  it('handles a single-word name', () => { expect(initials('Ramya')).toBe('RA') })
  it('falls back for missing names', () => { expect(initials(undefined)).toBe('?'); expect(initials('')).toBe('?') })
})

describe('formatDate', () => {
  it('returns a placeholder for missing dates', () => { expect(formatDate(null)).toBe('—'); expect(formatDate(undefined)).toBe('—') })
  it('formats a real date without throwing', () => { expect(formatDate('2026-01-15')).toMatch(/2026/) })
})

describe('timeAgo', () => {
  it('returns a placeholder for missing dates', () => { expect(timeAgo(null)).toBe('—') })
  it('reports very recent timestamps as "just now"', () => { expect(timeAgo(new Date().toISOString())).toBe('just now') })
})

describe('categoryColor', () => {
  it('is deterministic for the same category', () => {
    expect(categoryColor('Web Development')).toEqual(categoryColor('Web Development'))
  })
  it('returns a [bg, fg] pair', () => {
    const [bg, fg] = categoryColor('Design')
    expect(typeof bg).toBe('string')
    expect(typeof fg).toBe('string')
  })
  it('falls back gracefully for an empty category', () => {
    expect(() => categoryColor(undefined)).not.toThrow()
  })
})
