import { describe, expect, it } from 'vitest'
import { gameReducer } from './logic'
import { createGame, pairKey, type GameState } from './state'
import { isUnlocked, itemById, SHOP_ITEMS } from './shop'

const T0 = 1_000_000

function home(coins = 200): GameState {
  let g = createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0)
  g = gameReducer(g, { type: 'adopt', pet: { id: 'b', species: 'kitten', name: 'Mochi' }, now: T0 })
  g = gameReducer(g, { type: 'switch', petId: 'a', now: T0 })
  return { ...g, coins }
}
const buy = (g: GameState, itemId: string, quantity?: number) => gameReducer(g, { type: 'buy', itemId, quantity, now: T0 })

describe('buying', () => {
  it('food adds to the bag and costs price × quantity', () => {
    const g = buy(home(), 'kibble', 3)
    expect(g.inventory.kibble).toBe(5 + 3)
    expect(g.coins).toBe(200 - 12)
    expect(g.event).toMatchObject({ kind: 'buy', itemId: 'kibble', quantity: 3 })
  })

  it('refuses without enough coins and charges nothing', () => {
    const g = buy(home(5), 'cookie', 1)
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'notEnoughCoins' })
    expect(g.coins).toBe(5)
    expect(g.inventory.cookie).toBe(2)
  })

  it('toys, accessories and decor are bought once', () => {
    let g = buy(home(), 'feather')
    expect(g.owned.toys).toEqual(['feather'])
    g = buy(g, 'feather')
    expect(g.event).toMatchObject({ reason: 'owned' })
    expect(g.coins).toBe(200 - 35)
    g = buy(g, 'plant')
    expect(g.owned.decor).toEqual(['plant'])
  })

  it('level-locked items need a pet at that level', () => {
    let g = home()
    expect(buy(g, 'crown').event).toMatchObject({ reason: 'locked' })
    g = { ...g, pets: g.pets.map((p) => (p.id === 'b' ? { ...p, level: 3 } : p)) }
    expect(buy(g, 'crown').owned.accessories).toContain('crown')
  })

  it('the friendship bandana unlocks once two pets are Pals', () => {
    const g = home()
    const item = itemById('friendBandana')!
    expect(isUnlocked(g, item)).toBe(false)
    expect(isUnlocked({ ...g, friendships: { [pairKey('a', 'b')]: 20 } }, item)).toBe(true)
  })

  it('every item has a positive price', () => {
    expect(SHOP_ITEMS.every((i) => i.price > 0)).toBe(true)
  })
})

describe('shop toys', () => {
  it('can only be played with once owned', () => {
    const g = gameReducer(home(), { type: 'care', action: 'feather', now: T0 })
    expect(g.event).toMatchObject({ kind: 'refuse', reason: 'noToy' })
    const owned = gameReducer(buy(home(), 'feather'), { type: 'care', action: 'feather', now: T0 })
    expect(owned.event).toMatchObject({ kind: 'feather', deltas: { happiness: 16, energy: -9 } })
  })

  it('the bubble wand also gives health', () => {
    let g = { ...home(), pets: home().pets.map((p) => ({ ...p, level: 2, stats: { ...p.stats, health: 50 } })) }
    g = gameReducer(buy(g, 'bubbles'), { type: 'care', action: 'bubbles', now: T0 })
    expect(g.event!.deltas.health).toBe(5)
  })
})

describe('wearing accessories', () => {
  it('any pet can wear an owned accessory, and it can come off again', () => {
    let g = buy(home(), 'bow')
    g = gameReducer(g, { type: 'equip', petId: 'b', accessory: 'bow', now: T0 })
    g = gameReducer(g, { type: 'equip', petId: 'a', accessory: 'bow', now: T0 })
    expect(g.pets.map((p) => p.accessory)).toEqual(['bow', 'bow'])
    expect(g.event).toMatchObject({ kind: 'equip', petId: 'a' })
    g = gameReducer(g, { type: 'equip', petId: 'a', accessory: null, now: T0 })
    expect(g.pets[0]!.accessory).toBeNull()
  })

  it('cannot wear something not owned', () => {
    const g = gameReducer(home(), { type: 'equip', petId: 'a', accessory: 'crown', now: T0 })
    expect(g.pets[0]!.accessory).toBeNull()
  })
})
