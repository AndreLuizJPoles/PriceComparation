import { describe, expect, it } from 'vitest'
import { formatCurrency, parsePrice } from '@/lib/format'

describe('formatCurrency', () => {
  it('formats BRL values', () => {
    expect(formatCurrency('1234.5')).toMatch(/1\.234,50/)
  })

  it('returns dash for empty', () => {
    expect(formatCurrency(null)).toBe('—')
  })
})

describe('parsePrice', () => {
  it('parses numeric strings for comparison', () => {
    expect(parsePrice('10.5')).toBe(10.5)
    expect(parsePrice('')).toBe(Number.POSITIVE_INFINITY)
  })
})