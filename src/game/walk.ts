import { addStats, addXp, applyStats, diff, emit, refuse, replacePet, scaleStats } from './core'
import type { FoodId } from './items'
import { pairKey, type GameState, type RouteId, type Stats, type WalkEventKind, type WalkFound, type WalkSummary } from './state'

/** Walk rules. The screen rolls the random events; these functions only record and apply them. */

export type RouteInfo = { id: RouteId; name: string; blurb: string; durationMs: number; reward: number; maxEvents: number }

export const ROUTES: Record<RouteId, RouteInfo> = {
  stroll: { id: 'stroll', name: 'Short stroll', blurb: 'A quick loop round the pond.', durationMs: 45_000, reward: 1, maxEvents: 3 },
  meadow: { id: 'meadow', name: 'Meadow loop', blurb: 'Longer, with bigger rewards and more surprises.', durationMs: 90_000, reward: 1.7, maxEvents: 6 },
}
export const ROUTE_ORDER: RouteId[] = ['stroll', 'meadow']

/** A pet needs at least this much energy to set off. */
export const WALK_ENERGY = 15

/** Reward per walker for a full short stroll; scaled by route and by how much of the walk was done. */
export const WALK_BASE: { change: Partial<Stats>; xp: number; coins: number; friendship: number } = {
  change: { happiness: 14, bond: 6, energy: -10, fullness: -6, health: 2 },
  xp: 14,
  coins: 4,
  friendship: 6,
}
/** Extra happiness each pet gets for walking with company. */
export const GROUP_HAPPINESS = 3

export const WALK_EVENTS: Record<WalkEventKind, { coins?: number; bonus?: Partial<Stats>; friendship?: number; groupOnly?: boolean }> = {
  acorn: { coins: 3 },
  snack: {},
  friend: { bonus: { bond: 2 } },
  butterfly: { bonus: { happiness: 3 } },
  bench: { bonus: { energy: 5 } },
  flowers: { bonus: { health: 2, happiness: 1 } },
  puddle: { bonus: { happiness: 2 }, friendship: 4, groupOnly: true },
}

const emptyFound = (): WalkFound => ({ coins: 0, items: {}, bonus: {}, friendship: 0, events: [] })

export function canWalk(state: GameState, petId: string): 'ok' | 'asleep' | 'tired' {
  const pet = state.pets.find((p) => p.id === petId)
  if (!pet || pet.sleeping) return 'asleep'
  return pet.stats.energy >= WALK_ENERGY ? 'ok' : 'tired'
}

export function startWalk(state: GameState, petIds: string[], route: RouteId, now: number): GameState {
  const unique = [...new Set(petIds)]
  if (state.walk || unique.length === 0 || unique.some((id) => canWalk(state, id) !== 'ok')) return refuse(state, 'cantWalk')
  // The first walker leads, so they become the pet on stage.
  return { ...state, activeId: unique[0]!, walk: { petIds: unique, route, startedAt: now, found: emptyFound() } }
}

export function walkEvent(state: GameState, kind: WalkEventKind, food?: FoodId): GameState {
  const walk = state.walk
  if (!walk || walk.summary) return state
  if (walk.found.events.length >= ROUTES[walk.route].maxEvents) return state
  const def = WALK_EVENTS[kind]
  if (def.groupOnly && walk.petIds.length < 2) return state

  const found: WalkFound = {
    coins: walk.found.coins + (def.coins ?? 0),
    items: food ? { ...walk.found.items, [food]: (walk.found.items[food] ?? 0) + 1 } : walk.found.items,
    bonus: def.bonus ? addStats(walk.found.bonus, def.bonus) : walk.found.bonus,
    friendship: walk.found.friendship + (def.friendship ?? 0),
    events: [...walk.found.events, kind],
  }
  return { ...state, walk: { ...walk, found } }
}

/** How much of the walk has been done, 0–1. */
export function walkProgress(state: GameState, now: number): number {
  if (!state.walk) return 0
  return Math.min(1, Math.max(0, (now - state.walk.startedAt) / ROUTES[state.walk.route].durationMs))
}

/** Ends the walk (early or on time) and applies everything to the walkers. Rewards scale with distance walked. */
export function finishWalk(state: GameState, now: number): GameState {
  const walk = state.walk
  if (!walk || walk.summary) return state
  const done = walkProgress(state, now)
  const scale = done * ROUTES[walk.route].reward
  const group = walk.petIds.length > 1
  const base = addStats(scaleStats(WALK_BASE.change, scale), group ? { happiness: Math.round(GROUP_HAPPINESS * done) } : {})
  const change = addStats(base, walk.found.bonus)
  const xp = Math.round(WALK_BASE.xp * scale)

  let next = state
  let levelCoins = 0
  const perPet: WalkSummary['perPet'] = []
  for (const id of walk.petIds) {
    const pet = next.pets.find((p) => p.id === id)
    if (!pet) continue
    const stats = applyStats(pet.stats, change)
    const leveled = addXp({ ...pet, stats }, xp)
    levelCoins += leveled.bonus
    perPet.push({ petId: id, deltas: diff(pet.stats, stats), levelUp: leveled.levelUp })
    next = replacePet(next, leveled.pet)
  }

  const friendships = { ...next.friendships }
  const friendship: WalkSummary['friendship'] = []
  const pairGain = Math.round(WALK_BASE.friendship * scale) + walk.found.friendship
  for (let i = 0; i < walk.petIds.length; i++) {
    for (let j = i + 1; j < walk.petIds.length; j++) {
      const [a, b] = [walk.petIds[i]!, walk.petIds[j]!]
      const key = pairKey(a, b)
      const before = friendships[key] ?? 0
      friendships[key] = Math.min(100, before + pairGain)
      friendship.push({ a, b, gain: friendships[key] - before })
    }
  }

  const inventory = { ...next.inventory }
  for (const [food, n] of Object.entries(walk.found.items) as [FoodId, number][]) inventory[food] += n

  const coins = Math.round(WALK_BASE.coins * scale) + walk.found.coins
  const summary: WalkSummary = { completed: done, perPet, coins: coins + levelCoins, xp, items: walk.found.items, friendship }
  next = { ...next, inventory, friendships, coins: next.coins + coins + levelCoins, walk: { ...walk, summary } }

  const lead = perPet[0]
  return emit(next, walk.petIds[0]!, { kind: 'walk', deltas: lead?.deltas ?? {}, xp, coins: summary.coins, levelUp: lead?.levelUp })
}

/** Dismisses the results and returns everyone home. */
export function closeWalk(state: GameState): GameState {
  return state.walk?.summary ? { ...state, walk: null } : state
}

export function friendshipOf(state: GameState, a: string, b: string): number {
  return state.friendships[pairKey(a, b)] ?? 0
}
