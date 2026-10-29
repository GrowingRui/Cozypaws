import { describe, expect, it } from 'vitest'
import { gameReducer, tick } from './logic'
import { createGame, pairKey, type GameState, type Stats } from './state'
import { friendLevel, friendshipOf, SNUGGLE_FRIENDSHIP, TOGETHER } from './together'

const T0 = 1_000_000
const MIN = 60_000

function trio(): GameState {
  let g = createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0)
  g = gameReducer(g, { type: 'adopt', pet: { id: 'b', species: 'kitten', name: 'Mochi' }, now: T0 })
  g = gameReducer(g, { type: 'adopt', pet: { id: 'c', species: 'bunny', name: 'Clover' }, now: T0 })
  return gameReducer(g, { type: 'switch', petId: 'a', now: T0 })
}
const patch = (g: GameState, id: string, stats: Partial<Stats>, extra: object = {}): GameState => ({
  ...g,
  pets: g.pets.map((p) => (p.id === id ? { ...p, ...extra, stats: { ...p.stats, ...stats } } : p)),
})
const pet = (g: GameState, id: string) => g.pets.find((p) => p.id === id)!

describe('playing together', () => {
  it('both pets gain, with a social bonus, and their friendship grows', () => {
    const g = gameReducer(trio(), { type: 'playTogether', buddyId: 'b', game: 'catch', now: T0 })
    expect(pet(g, 'a').stats.happiness).toBe(70 + 14 + 3)
    expect(pet(g, 'b').stats.happiness).toBe(70 + 14 + 3)
    expect(pet(g, 'b').stats.energy).toBe(80 - 14)
    expect(pet(g, 'c').stats.happiness).toBe(70)
    expect(friendshipOf(g, 'a', 'b')).toBe(TOGETHER.catch.friendship)
    expect(g.event).toMatchObject({ kind: 'together', game: 'catch', buddyId: 'b', petId: 'a' })
  })

  it('tug-of-war builds more friendship than catch', () => {
    expect(TOGETHER.tug.friendship).toBeGreaterThan(TOGETHER.catch.friendship)
  })

  it('a sleeping or tired buddy politely declines', () => {
    const asleep = gameReducer(patch(trio(), 'b', {}, { sleeping: true }), { type: 'playTogether', buddyId: 'b', game: 'tug', now: T0 })
    expect(asleep.event).toMatchObject({ kind: 'refuse', reason: 'buddyTired', buddyId: 'b' })
    const tired = gameReducer(patch(trio(), 'b', { energy: 5 }), { type: 'playTogether', buddyId: 'b', game: 'catch', now: T0 })
    expect(tired.event).toMatchObject({ reason: 'buddyTired' })
    expect(friendshipOf(tired, 'a', 'b')).toBe(0)
  })

  it('repeating quickly gives less, like solo play', () => {
    let g = trio()
    const gains: number[] = []
    for (let i = 0; i < 4; i++) {
      g = gameReducer(patch(g, 'a', { energy: 100 }), { type: 'playTogether', buddyId: 'b', game: 'tug', now: T0 + i * 1000 })
      gains.push(g.event!.friendship!)
    }
    expect(gains).toEqual([6, 6, 4, 3])
  })
})

describe('napping together', () => {
  it('puts every awake pet listed to sleep, skipping ones already asleep', () => {
    const g = gameReducer(trio(), { type: 'napTogether', petIds: ['a', 'b', 'c'], now: T0 })
    expect(g.pets.every((p) => p.sleeping)).toBe(true)
    expect(g.event).toMatchObject({ kind: 'napTogether', petIds: ['a', 'b', 'c'] })
  })

  it('needs at least two pets', () => {
    const g = gameReducer(trio(), { type: 'napTogether', petIds: ['a'], now: T0 })
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'needTwo' })
  })

  it('pals rest faster when they snuggle, and napping grows friendship', () => {
    let g = trio()
    g = { ...g, friendships: { [pairKey('a', 'b')]: SNUGGLE_FRIENDSHIP } }
    g = patch(patch(patch(g, 'a', { energy: 20 }), 'b', { energy: 20 }), 'c', { energy: 20 })
    g = gameReducer(g, { type: 'napTogether', petIds: ['a', 'b', 'c'], now: T0 })
    g = tick(g, T0 + 2 * MIN)
    // a and b are pals (boosted); c has no pal yet (normal rate).
    expect(pet(g, 'a').stats.energy).toBeCloseTo(20 + 24 * 1.25 * 2)
    expect(pet(g, 'c').stats.energy).toBeCloseTo(20 + 24 * 2)
    expect(friendshipOf(g, 'a', 'c')).toBeCloseTo(1)
  })
})

describe('dinner', () => {
  it('feeds every hungry, awake pet from the shared bag', () => {
    let g = patch(patch(trio(), 'a', { fullness: 30 }), 'b', { fullness: 50 })
    g = patch(g, 'c', { fullness: 40 }, { sleeping: true })
    g = gameReducer(g, { type: 'dinner', now: T0 })
    expect(g.event).toMatchObject({ kind: 'dinner', petIds: ['a', 'b'] })
    expect(pet(g, 'a').stats.fullness).toBe(60)
    expect(pet(g, 'c').stats.fullness).toBe(40)
    expect(g.inventory.kibble).toBe(3)
    expect(friendshipOf(g, 'a', 'b')).toBe(2)
  })

  it('hungriest pets eat first when food runs short', () => {
    let g = patch(patch(trio(), 'a', { fullness: 60 }), 'b', { fullness: 20 })
    g = { ...g, inventory: { kibble: 1, cookie: 0, veggies: 0, smoothie: 0, cake: 0 } }
    g = gameReducer(g, { type: 'dinner', now: T0 })
    expect(g.event!.petIds).toEqual(['b'])
  })

  it('says so when nobody is hungry', () => {
    let g = trio()
    for (const id of ['a', 'b', 'c']) g = patch(g, id, { fullness: 95 })
    expect(gameReducer(g, { type: 'dinner', now: T0 }).event).toMatchObject({ reason: 'noOneHungry' })
  })
})

describe('friendship', () => {
  it('grows a little when pets meet on their own, but not while asleep', () => {
    const g = gameReducer(trio(), { type: 'socialize', a: 'b', b: 'c', now: T0 })
    expect(friendshipOf(g, 'b', 'c')).toBe(1)
    const asleep = gameReducer(patch(trio(), 'c', {}, { sleeping: true }), { type: 'socialize', a: 'b', b: 'c', now: T0 })
    expect(friendshipOf(asleep, 'b', 'c')).toBe(0)
  })

  it('has named levels', () => {
    expect(friendLevel(0).label).toBe('New friends')
    expect(friendLevel(20).label).toBe('Pals')
    expect(friendLevel(50).label).toBe('Good friends')
    expect(friendLevel(85).label).toBe('Best friends')
  })

  it('never goes above 100', () => {
    let g = { ...trio(), friendships: { [pairKey('a', 'b')]: 98 } }
    g = gameReducer(g, { type: 'playTogether', buddyId: 'b', game: 'tug', now: T0 })
    expect(friendshipOf(g, 'a', 'b')).toBe(100)
  })
})
