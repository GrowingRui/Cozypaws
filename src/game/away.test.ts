import { describe, expect, it } from 'vitest'
import { AWAY_MIN_MS, awayDuration, summarizeAway } from './away'
import { MAX_ELAPSED_MS } from './logic'
import { createGame, createPet, type GameState } from './state'

const T0 = 1_000_000
const MIN = 60_000
const HOUR = 60 * MIN
const fresh = (): GameState => createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0)

describe('welcome back summary', () => {
  it('skips short breaks', () => {
    expect(summarizeAway(fresh(), T0 + AWAY_MIN_MS - 1)).toBeNull()
  })

  it('reports how needs changed and what a pet wants now', () => {
    const s = summarizeAway(fresh(), T0 + HOUR)!
    expect(s.awayMs).toBe(HOUR)
    expect(s.capped).toBe(false)
    const news = s.pets[0]!
    expect(news.name).toBe('Biscuit')
    expect(news.changes.fullness).toBe(-60)
    expect(news.need).toBe('fullness')
    expect(news.line).toBe('Is getting hungry')
  })

  it('says when a sleeping pet woke up rested', () => {
    const g = fresh()
    const sleepy = { ...g, pets: [{ ...g.pets[0]!, sleeping: true, stats: { ...g.pets[0]!.stats, energy: 40 } }] }
    const news = summarizeAway(sleepy, T0 + 30 * MIN)!.pets[0]!
    expect(news.line).toMatch(/^Woke up rested|^Had a long nap/)
    expect(news.changes.energy).toBe(60)
  })

  it('covers every pet in the household', () => {
    const g = fresh()
    const two = { ...g, pets: [...g.pets, createPet({ id: 'b', species: 'kitten', name: 'Mochi' })] }
    const s = summarizeAway(two, T0 + HOUR)!
    expect(s.pets.map((p) => p.name)).toEqual(['Biscuit', 'Mochi'])
    // Same need, different words.
    expect(s.pets[0]!.line).not.toBe(s.pets[1]!.line)
  })

  it('notes when the time away went past the catch-up limit', () => {
    expect(summarizeAway(fresh(), T0 + MAX_ELAPSED_MS + HOUR)!.capped).toBe(true)
  })
})

describe('away duration wording', () => {
  it('reads naturally', () => {
    expect(awayDuration(20 * MIN)).toBe('20 minutes')
    expect(awayDuration(HOUR)).toBe('an hour')
    expect(awayDuration(5 * HOUR)).toBe('5 hours')
    expect(awayDuration(26 * HOUR)).toBe('a day')
    expect(awayDuration(3 * 24 * HOUR)).toBe('3 days')
  })
})
