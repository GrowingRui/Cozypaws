import { describe, expect, it } from 'vitest'
import { DECAY_FLOOR, FETCH_ENERGY, gameReducer, restingMood, tick, xpToNext } from './logic'
import { suggestName, validateName } from './pets'
import { activePet, createGame, MAX_PETS, type GameState, type Stats } from './state'

const T0 = 1_000_000
const MIN = 60_000
const fresh = (patch: Partial<Stats> = {}): GameState => {
  const g = createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0)
  return { ...g, pets: g.pets.map((p) => ({ ...p, stats: { ...p.stats, ...patch } })) }
}
const stats = (g: GameState) => activePet(g).stats
const withPetPatch = (g: GameState, patch: Partial<Stats>): GameState => ({
  ...g,
  pets: g.pets.map((p) => (p.id === g.activeId ? { ...p, stats: { ...p.stats, ...patch } } : p)),
})

describe('time-based change', () => {
  it('slowly lowers needs while awake', () => {
    const g = tick(fresh(), T0 + 10 * MIN)
    expect(stats(g).fullness).toBeCloseTo(70 - 12)
    expect(stats(g).happiness).toBeCloseTo(70 - 8)
    expect(stats(g).energy).toBeCloseTo(80 - 6)
    expect(stats(g).bond).toBe(10)
  })

  it('never lets time alone push needs below the floor', () => {
    const g = tick(fresh(), T0 + 7 * 60 * MIN)
    expect(stats(g).fullness).toBe(DECAY_FLOOR)
    expect(stats(g).happiness).toBe(DECAY_FLOOR)
  })

  it('caps very long absences', () => {
    const a = tick(fresh({ health: 90 }), T0 + 8 * 60 * MIN)
    const b = tick(fresh({ health: 90 }), T0 + 300 * 60 * MIN)
    expect(stats(b)).toEqual(stats(a))
  })

  it('restores energy during sleep and wakes when fully rested', () => {
    let g = gameReducer(fresh({ energy: 40 }), { type: 'sleep', now: T0 })
    expect(activePet(g).sleeping).toBe(true)
    g = tick(g, T0 + 1 * MIN)
    expect(stats(g).energy).toBeCloseTo(64)
    g = tick(g, T0 + 5 * MIN)
    expect(activePet(g).sleeping).toBe(false)
    expect(g.event).toMatchObject({ kind: 'wake', rested: true, petId: 'a' })
  })

  it('lowers health only when the pet is badly neglected', () => {
    const fine = tick(fresh({ fullness: 60, health: 80 }), T0 + 10 * MIN)
    expect(stats(fine).health).toBeGreaterThanOrEqual(80)
    const starving = tick(fresh({ fullness: 12, health: 80 }), T0 + 10 * MIN)
    expect(stats(starving).health).toBeLessThan(80)
  })
})

describe('feeding', () => {
  it('uses one item and applies that food’s effect', () => {
    const g = gameReducer(fresh({ fullness: 40 }), { type: 'feed', food: 'kibble', now: T0 })
    expect(g.inventory.kibble).toBe(4)
    expect(stats(g).fullness).toBe(70)
    expect(g.event).toMatchObject({ kind: 'feed', food: 'kibble', deltas: { fullness: 30 } })
  })

  it('gives each food a different speciality', () => {
    const cookie = gameReducer(fresh({ fullness: 40 }), { type: 'feed', food: 'cookie', now: T0 })
    const veggies = gameReducer(fresh({ fullness: 40, health: 50 }), { type: 'feed', food: 'veggies', now: T0 })
    expect(cookie.event!.deltas.happiness).toBe(15)
    expect(veggies.event!.deltas.health).toBe(10)
  })

  it('refuses when out of that food, without changing stats', () => {
    const empty = { ...fresh({ fullness: 40 }), inventory: { kibble: 0, cookie: 1, veggies: 1 } }
    const g = gameReducer(empty, { type: 'feed', food: 'kibble', now: T0 })
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'noFood' })
    expect(stats(g).fullness).toBe(40)
  })

  it('refuses when already full, and keeps the item', () => {
    const g = gameReducer(fresh({ fullness: 97 }), { type: 'feed', food: 'kibble', now: T0 })
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'full' })
    expect(g.inventory.kibble).toBe(5)
  })
})

describe('care actions', () => {
  it('petting raises happiness and bond', () => {
    const g = gameReducer(fresh(), { type: 'care', action: 'pet', now: T0 })
    expect(g.event).toMatchObject({ kind: 'pet', deltas: { happiness: 8, bond: 4 } })
  })

  it('play costs energy and food but raises happiness, and pays coins', () => {
    const g = gameReducer(fresh(), { type: 'care', action: 'play', now: T0 })
    expect(stats(g).energy).toBe(68)
    expect(stats(g).fullness).toBe(65)
    expect(stats(g).happiness).toBe(84)
    expect(g.coins).toBe(32)
  })

  it('a tired pet refuses to fetch', () => {
    const g = gameReducer(fresh({ energy: FETCH_ENERGY - 1 }), { type: 'care', action: 'fetch', now: T0 })
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'tooTired' })
  })

  it('repeating the same action quickly gives smaller gains, then recovers', () => {
    let g = fresh({ happiness: 10 })
    const gains: number[] = []
    for (let i = 0; i < 6; i++) {
      g = gameReducer(g, { type: 'care', action: 'pet', now: T0 + i * 1000 })
      gains.push(g.event!.deltas.happiness ?? 0)
    }
    expect(gains).toEqual([8, 8, 6, 4, 2, 2])
    expect(g.event!.diminished).toBe(true)
    const later = gameReducer(g, { type: 'care', action: 'pet', now: T0 + 2 * MIN })
    expect(later.event!.diminished).toBe(false)
  })

  it('every action emits a new event id so reactions can replay', () => {
    let g = fresh()
    const ids = new Set<number>()
    for (let i = 0; i < 3; i++) {
      g = gameReducer(g, { type: 'care', action: 'pet', now: T0 + i })
      ids.add(g.event!.id)
    }
    expect(ids.size).toBe(3)
  })

  it('actions are blocked while asleep', () => {
    const asleep = gameReducer(fresh(), { type: 'sleep', now: T0 })
    const g = gameReducer(asleep, { type: 'care', action: 'play', now: T0 + 10 })
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'asleep' })
  })
})

describe('progression', () => {
  it('levels up with a coin reward and carries extra xp over', () => {
    let g = fresh()
    g = { ...g, pets: g.pets.map((p) => ({ ...p, xp: xpToNext(1) - 2 })) }
    g = gameReducer(g, { type: 'care', action: 'pet', now: T0 })
    expect(activePet(g).level).toBe(2)
    expect(activePet(g).xp).toBe(2)
    expect(g.event!.levelUp).toBe(2)
    expect(g.coins).toBe(30 + 30)
  })
})

describe('household', () => {
  const kitten = { id: 'b', species: 'kitten' as const, name: 'Mochi' }

  it('adopting adds a pet and makes it the active one', () => {
    const g = gameReducer(fresh(), { type: 'adopt', pet: kitten, now: T0 })
    expect(g.pets.map((p) => p.name)).toEqual(['Biscuit', 'Mochi'])
    expect(g.activeId).toBe('b')
    expect(g.event).toMatchObject({ kind: 'adopt', petId: 'b' })
  })

  it('has room for a limited number of pets', () => {
    let g = fresh()
    for (let i = 0; i < MAX_PETS + 2; i++) g = gameReducer(g, { type: 'adopt', pet: { id: `p${i}`, species: 'bunny', name: `Bun ${i}` }, now: T0 })
    expect(g.pets).toHaveLength(MAX_PETS)
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'houseFull' })
  })

  it('actions affect only the active pet, while coins and food are shared', () => {
    let g = gameReducer(fresh({ fullness: 40 }), { type: 'adopt', pet: kitten, now: T0 })
    g = withPetPatch(g, { fullness: 40 })
    g = gameReducer(g, { type: 'feed', food: 'kibble', now: T0 })
    g = gameReducer(g, { type: 'care', action: 'play', now: T0 })
    const [biscuit, mochi] = g.pets
    expect(biscuit!.stats.fullness).toBe(40)
    expect(mochi!.stats.fullness).toBe(65)
    expect(g.inventory.kibble).toBe(4)
    expect(g.coins).toBe(32)
  })

  it('switching changes the active pet and emits a greeting event', () => {
    let g = gameReducer(fresh(), { type: 'adopt', pet: kitten, now: T0 })
    g = gameReducer(g, { type: 'switch', petId: 'a', now: T0 })
    expect(g.activeId).toBe('a')
    expect(g.event).toMatchObject({ kind: 'switch', petId: 'a' })
    const same = gameReducer(g, { type: 'switch', petId: 'a', now: T0 })
    expect(same.event!.id).toBe(g.event!.id)
  })

  it('time passes for every pet, and each sleeps on its own', () => {
    let g = gameReducer(fresh({ energy: 40 }), { type: 'sleep', now: T0 })
    g = gameReducer(g, { type: 'adopt', pet: kitten, now: T0 })
    g = tick(g, T0 + MIN)
    const [biscuit, mochi] = g.pets
    expect(biscuit!.sleeping).toBe(true)
    expect(biscuit!.stats.energy).toBeCloseTo(64)
    expect(mochi!.sleeping).toBe(false)
    expect(mochi!.stats.energy).toBeCloseTo(79.4)
  })
})

describe('names', () => {
  it('must be unique in the household, ignoring case', () => {
    expect(validateName('mochi', ['Mochi'])).toBe('You already have a pet called Mochi. Try another name.')
    expect(validateName('Miso', ['Mochi'])).toBeNull()
  })

  it('suggests a name nobody is using yet', () => {
    expect(suggestName('kitten', [])).toBe('Mochi')
    expect(suggestName('kitten', ['Mochi'])).toBe('Miso')
  })
})

describe('resting mood', () => {
  it('reflects needs', () => {
    expect(restingMood(activePet(fresh()))).toBe('idle')
    expect(restingMood(activePet(fresh({ fullness: 10 })))).toBe('hungry')
    expect(restingMood(activePet(fresh({ energy: 10 })))).toBe('tired')
    expect(restingMood({ ...activePet(fresh()), sleeping: true })).toBe('sleeping')
  })
})
