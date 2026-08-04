import { describe, it, expect } from 'vitest'
import { countWords, slugify, cn } from '@/lib/utils'

describe('countWords', () => {
  it('counts words in a sentence', () => {
    expect(countWords('Bonjour le monde')).toBe(3)
  })

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('returns 0 for whitespace only', () => {
    expect(countWords('   ')).toBe(0)
  })

  it('handles multiple spaces', () => {
    expect(countWords('un  deux  trois')).toBe(3)
  })
})

describe('slugify', () => {
  it('converts to slug', () => {
    expect(slugify('Gilgamesh')).toBe('gilgamesh')
  })

  it('handles accents', () => {
    expect(slugify('Akhenaton')).toBe('akhenaton')
  })

  it('handles spaces', () => {
    expect(slugify('Mon Projet')).toBe('mon-projet')
  })

  it('handles special characters', () => {
    expect(slugify('Projet : Été 2026')).toBe('projet-ete-2026')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('merges tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('Demo data', () => {
  it('Gilgamesh project has required fields', async () => {
    const { DEMO_PROJECTS } = await import('@/lib/demo-data')
    const gilgamesh = DEMO_PROJECTS.find(p => p.slug === 'gilgamesh')
    expect(gilgamesh).toBeDefined()
    expect(gilgamesh?.title).toBe('Gilgamesh')
    expect(gilgamesh?.logline).not.toBe('')
    expect(gilgamesh?.characters.length).toBeGreaterThan(0)
    expect(gilgamesh?.loglineHistory.length).toBeGreaterThan(0)
  })

  it('all demo projects have slugs', async () => {
    const { DEMO_PROJECTS } = await import('@/lib/demo-data')
    for (const project of DEMO_PROJECTS) {
      expect(project.slug).toBeTruthy()
      expect(project.slug).not.toContain(' ')
    }
  })

  it('has 6 demo projects', async () => {
    const { DEMO_PROJECTS } = await import('@/lib/demo-data')
    expect(DEMO_PROJECTS.length).toBe(6)
  })
})
