import { describe, expect, it } from 'vitest'
import { gameReducer } from './logic'
import { createGame, type GameState, type Stats } from './state'
import { friendshipOf, ROUTES, WALK_ENERGY } from './walk'

const T0 = 1_000_000
const SEC = 1000

function household(...extra: { id: string; species: 'kitten' | 'bunny' | 'horse'; name: string }[]): GameState {
  let g = createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0)
  for (const pet of extra) g = gameReducer(g, { type: 'adopt', pet, now: T0 })
  return g
}
const patch = (g: GameState, id: string, stats: Partial<Stats>): GameState => ({
  ...g,
  pets: g.pets.map((p) => (p.id === id ? { ...p, stats: { ...p.stats, ...stats } } : p)),
})
const pet = (g: GameState, id: string) => g.pets.find((p) => p.id === id)!

describe('walks', () => {
  it('a full stroll raises happiness and bond, costs some energy, and pays coins', () => {
    let g = household()
    g = gameReducer(g, { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    g = gameReducer(g, { type: 'finishWalk', now: T0 + ROUTES.stroll.durationMs })
    const s = g.walk!.summary!
    expect(s.completed).toBe(1)
    expect(s.perPet[0]!.deltas).toMatchObject({ happiness: 14, bond: 6, energy: -10 })
    expect(g.coins).toBe(30 + 4)
    expect(g.event).toMatchObject({ kind: 'walk', petId: 'a' })
  })

  it('heading home early gives a share of the reward', () => {
    let g = household()
    g = gameReducer(g, { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    g = gameReducer(g, { type: 'finishWalk', now: T0 + ROUTES.stroll.durationMs / 2 })
    expect(g.walk!.summary!.completed).toBeCloseTo(0.5)
    expect(g.walk!.summary!.perPet[0]!.deltas.happiness).toBe(7)
  })

  it('the meadow loop rewards more than the stroll', () => {
    const run = (route: 'stroll' | 'meadow') => {
      let g = household()
      g = gameReducer(g, { type: 'startWalk', petIds: ['a'], route, now: T0 })
      g = gameReducer(g, { type: 'finishWalk', now: T0 + ROUTES[route].durationMs })
      return g.walk!.summary!.perPet[0]!.deltas.happiness!
    }
    expect(run('meadow')).toBeGreaterThan(run('stroll'))
  })

  it('sleeping or very tired pets cannot set off', () => {
    let g = household({ id: 'b', species: 'kitten', name: 'Mochi' })
    g = patch(g, 'b', { energy: WALK_ENERGY - 1 })
    const tired = gameReducer(g, { type: 'startWalk', petIds: ['a', 'b'], route: 'stroll', now: T0 })
    expect(tired.walk).toBeNull()
    expect(tired.event).toMatchObject({ kind: 'refuse', reason: 'cantWalk' })
  })

  it('walking together adds a group bonus and grows friendship for each pair', () => {
    let g = household({ id: 'b', species: 'kitten', name: 'Mochi' }, { id: 'c', species: 'bunny', name: 'Clover' })
    g = gameReducer(g, { type: 'startWalk', petIds: ['b', 'a', 'c'], route: 'stroll', now: T0 })
    expect(g.activeId).toBe('b')
    g = gameReducer(g, { type: 'finishWalk', now: T0 + ROUTES.stroll.durationMs })
    const s = g.walk!.summary!
    expect(s.perPet).toHaveLength(3)
    expect(s.perPet[0]!.deltas.happiness).toBe(14 + 3)
    expect(s.friendship).toHaveLength(3)
    expect(friendshipOf(g, 'a', 'b')).toBe(6)
    expect(friendshipOf(g, 'c', 'a')).toBe(6)
  })

  it('events along the way are collected and applied at the end', () => {
    let g = household({ id: 'b', species: 'kitten', name: 'Mochi' })
    g = gameReducer(g, { type: 'startWalk', petIds: ['a', 'b'], route: 'meadow', now: T0 })
    g = gameReducer(g, { type: 'walkEvent', kind: 'acorn', now: T0 + 10 * SEC })
    g = gameReducer(g, { type: 'walkEvent', kind: 'snack', food: 'cookie', now: T0 + 20 * SEC })
    g = gameReducer(g, { type: 'walkEvent', kind: 'puddle', now: T0 + 30 * SEC })
    g = gameReducer(g, { type: 'finishWalk', now: T0 + ROUTES.meadow.durationMs })
    expect(g.inventory.cookie).toBe(3)
    expect(g.walk!.summary!.items).toEqual({ cookie: 1 })
    expect(friendshipOf(g, 'a', 'b')).toBe(Math.round(6 * 1.7) + 4)
  })

  it('caps events per route and ignores group events on a solo walk', () => {
    let g = household()
    g = gameReducer(g, { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    g = gameReducer(g, { type: 'walkEvent', kind: 'puddle', now: T0 })
    expect(g.walk!.found.events).toEqual([])
    for (let i = 0; i < 6; i++) g = gameReducer(g, { type: 'walkEvent', kind: 'acorn', now: T0 + i })
    expect(g.walk!.found.events).toHaveLength(ROUTES.stroll.maxEvents)
  })

  it('results stay until closed, then everyone is home', () => {
    let g = household()
    g = gameReducer(g, { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    const again = gameReducer(g, { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    expect(again.event).toMatchObject({ reason: 'cantWalk' })
    g = gameReducer(g, { type: 'finishWalk', now: T0 + 5 * SEC })
    expect(gameReducer(g, { type: 'finishWalk', now: T0 + 50 * SEC }).walk!.summary).toEqual(g.walk!.summary)
    g = gameReducer(g, { type: 'closeWalk', now: T0 + 6 * SEC })
    expect(g.walk).toBeNull()
    expect(pet(g, 'a').stats.happiness).toBeGreaterThan(70)
  })
})
