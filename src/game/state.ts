import type { FoodId } from './items'
import type { Accessory, Species } from './types'

/** All stats run 0–100 and higher is always better ("fullness" is shown as Tummy). */
export type Stats = {
  fullness: number
  happiness: number
  energy: number
  health: number
  bond: number
}
export type StatKey = keyof Stats
export const STAT_KEYS: StatKey[] = ['fullness', 'happiness', 'energy', 'health', 'bond']

export type CareAction = 'pet' | 'play' | 'fetch'

export type RefuseReason = 'full' | 'noFood' | 'tooTired' | 'asleep' | 'houseFull' | 'cantWalk'

/** Something that just happened, for the UI to react to. A new id means "play the reaction again". */
export type GameEvent = {
  id: number
  /** The pet this happened to. */
  petId: string
  kind: 'feed' | 'pet' | 'play' | 'fetch' | 'sleep' | 'wake' | 'refuse' | 'adopt' | 'switch' | 'walk'
  food?: FoodId
  reason?: RefuseReason
  deltas: Partial<Stats>
  xp: number
  coins: number
  levelUp?: number
  /** True when the same action was repeated a lot and its gains were reduced. */
  diminished?: boolean
  /** For wake: whether the pet slept until fully rested. */
  rested?: boolean
}

/** One pet in the household. Each pet has its own needs, progress and sleep. */
export type PetState = {
  id: string
  species: Species
  name: string
  accessory: Accessory | null
  stats: Stats
  level: number
  xp: number
  sleeping: boolean
  /** Recent care timestamps, used for diminishing returns on spammed actions. */
  recent: Record<CareAction, number[]>
}

/** The whole household: pets plus shared coins and food. */
export type GameState = {
  version: 2
  pets: PetState[]
  activeId: string
  coins: number
  inventory: Record<FoodId, number>
  /** Timestamp (ms) of the last time-based update. */
  lastTick: number
  /** Friendship between each pair of pets, 0–100, keyed by pairKey(a, b). */
  friendships: Record<string, number>
  /** The walk in progress (or just finished, while its results are shown). */
  walk: WalkState | null
  eventSeq: number
  event: GameEvent | null
}

export type RouteId = 'stroll' | 'meadow'

export type WalkEventKind = 'acorn' | 'snack' | 'friend' | 'butterfly' | 'bench' | 'flowers' | 'puddle'

/** What a walk has collected so far; applied to the pets when the walk ends. */
export type WalkFound = {
  coins: number
  items: Partial<Record<FoodId, number>>
  /** Extra stat changes for every walker, on top of the base walk reward. */
  bonus: Partial<Stats>
  /** Extra friendship for every pair of walkers. */
  friendship: number
  events: WalkEventKind[]
}

export type WalkSummary = {
  completed: number
  perPet: { petId: string; deltas: Partial<Stats>; levelUp?: number }[]
  coins: number
  xp: number
  items: Partial<Record<FoodId, number>>
  friendship: { a: string; b: string; gain: number }[]
}

export type WalkState = {
  petIds: string[]
  route: RouteId
  startedAt: number
  found: WalkFound
  summary?: WalkSummary
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export const MAX_PETS = 4

export type NewPet = { id: string; species: Species; name: string }

export function createPet({ id, species, name }: NewPet): PetState {
  return {
    id,
    species,
    name,
    accessory: null,
    stats: { fullness: 70, happiness: 70, energy: 80, health: 90, bond: 10 },
    level: 1,
    xp: 0,
    sleeping: false,
    recent: { pet: [], play: [], fetch: [] },
  }
}

export function createGame(first: NewPet, now: number): GameState {
  return {
    version: 2,
    pets: [createPet(first)],
    activeId: first.id,
    coins: 30,
    inventory: { kibble: 5, cookie: 2, veggies: 2 },
    lastTick: now,
    friendships: {},
    walk: null,
    eventSeq: 0,
    event: null,
  }
}

export function activePet(state: GameState): PetState {
  return state.pets.find((p) => p.id === state.activeId) ?? state.pets[0]!
}

export const newPetId = () => `pet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
