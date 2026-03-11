import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

describe('Project setup verification', () => {
  it('fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9 }), (n) => {
        return n >= 1 && n <= 9
      })
    )
  })

  it('vitest globals work', () => {
    expect(true).toBe(true)
  })
})
