import { FOODS, type FoodId } from './items'
import {
  activePet,
  createPet,
  MAX_PETS,
  STAT_KEYS,
  type CareAction,
  type GameEvent,
  type GameState,
  type NewPet,
  type PetState,
  type Stats,
} from './state'
import type { PetMood } from './types'

/**
 * Pure game rules. Every function takes the current state (and the time) and returns a new state,
 * so the rules can be unit-tested and later run on a server without changes.
 */

export const clamp = (v: number) => Math.max(0, Math.min(100, v))

// ---- Time-based change (per minute) -------------------------------------------------------

export const RATES = {
  awake: { fullness: -1.2, happiness: -0.8, energy: -0.6 },
  asleep: { fullness: -0.5, happiness: -0.2, energy: 24 },
}
/** Needs never fall below this from time alone, so a pet is never in crisis after a break. */
export const DECAY_FLOOR = 10
export const HEALTH_FLOOR = 20
/** Long absences only count up to this much time. */
export const MAX_ELAPSED_MS = 8 * 60 * 60 * 1000

function decayTo(value: number, ratePerMin: number, minutes: number, floor: number) {
  const next = value + ratePerMin * minutes
  if (ratePerMin >= 0) return clamp(next)
  // Decay stops at the floor but never pushes a value that is already below it.
  return Math.min(value, Math.max(floor, next))
}

function tickPet(pet: PetState, minutes: number): PetState {
  const s = pet.stats
  const r = pet.sleeping ? RATES.asleep : RATES.awake

  // Health slips only when needs are badly neglected, and recovers with good care or rest.
  let healthRate = 0
  if (s.fullness < 20 || s.energy < 10) healthRate = -0.6
  else if (pet.sleeping) healthRate = 0.6
  else if (s.fullness >= 50 && s.happiness >= 50) healthRate = 0.4

  return {
    ...pet,
    stats: {
      ...s,
      fullness: decayTo(s.fullness, r.fullness, minutes, DECAY_FLOOR),
      happiness: decayTo(s.happiness, r.happiness, minutes, DECAY_FLOOR),
      energy: decayTo(s.energy, r.energy, minutes, DECAY_FLOOR),
      health: decayTo(s.health, healthRate, minutes, HEALTH_FLOOR),
    },
  }
}

/** Every pet in the household lives on, whether or not it is the one on screen. */
export function tick(state: GameState, now: number): GameState {
  const elapsed = Math.min(Math.max(0, now - state.lastTick), MAX_ELAPSED_MS)
  if (elapsed < 250) return state
  const minutes = elapsed / 60000
  let next: GameState = { ...state, lastTick: now, pets: state.pets.map((p) => tickPet(p, minutes)) }

  // Sleeping pets wake up on their own once fully rested.
  for (const pet of next.pets) {
    if (pet.sleeping && pet.stats.energy >= 100) next = wakePet(next, pet.id, true)
  }
  return next
}

// ---- Progression --------------------------------------------------------------------------

export const xpToNext = (level: number) => 40 + (level - 1) * 20
export const levelReward = (level: number) => 20 + level * 5

/** Adds xp to a pet; level-up coin rewards go to the shared purse. */
function addXp(pet: PetState, xp: number): { pet: PetState; levelUp?: number; bonus: number } {
  let { level } = pet
  let total = pet.xp + xp
  let bonus = 0
  let levelUp: number | undefined
  while (total >= xpToNext(level)) {
    total -= xpToNext(level)
    level += 1
    bonus += levelReward(level)
    levelUp = level
  }
  return { pet: { ...pet, level, xp: total }, levelUp, bonus }
}

// ---- Helpers ------------------------------------------------------------------------------

function applyStats(stats: Stats, change: Partial<Stats>): Stats {
  const next = { ...stats }
  for (const k of STAT_KEYS) if (change[k] !== undefined) next[k] = clamp(next[k] + change[k]!)
  return next
}

function diff(before: Stats, after: Stats): Partial<Stats> {
  const out: Partial<Stats> = {}
  for (const k of STAT_KEYS) {
    const d = Math.round(after[k]) - Math.round(before[k])
    if (d !== 0) out[k] = d
  }
  return out
}

function replacePet(state: GameState, pet: PetState): GameState {
  return { ...state, pets: state.pets.map((p) => (p.id === pet.id ? pet : p)) }
}

type EventInput = Omit<GameEvent, 'id' | 'petId' | 'deltas' | 'xp' | 'coins'> & Partial<Pick<GameEvent, 'deltas' | 'xp' | 'coins'>>

function emit(state: GameState, petId: string, event: EventInput): GameState {
  const id = state.eventSeq + 1
  return { ...state, eventSeq: id, event: { deltas: {}, xp: 0, coins: 0, ...event, id, petId } }
}

function refuse(state: GameState, reason: GameEvent['reason']): GameState {
  return emit(state, state.activeId, { kind: 'refuse', reason })
}

const RECENT_WINDOW_MS = 60_000
/** Gain multiplier for the nth repeat of the same action within a minute. */
const REPEAT_FACTORS = [1, 1, 0.7, 0.5, 0.3]
const MIN_FACTOR = 0.2

/** Scales positive gains by the repeat factor; costs (negative values) always apply in full. */
function scaleGains(change: Partial<Stats>, factor: number): Partial<Stats> {
  const out: Partial<Stats> = {}
  for (const k of STAT_KEYS) {
    const v = change[k]
    if (v !== undefined) out[k] = v > 0 ? Math.round(v * factor) : v
  }
  return out
}

/** Applies a stat change + rewards to a pet and emits the matching event. */
function resolve(
  state: GameState,
  pet: PetState,
  kind: GameEvent['kind'],
  change: Partial<Stats>,
  xp: number,
  coins: number,
  extra: Partial<GameEvent> = {},
): GameState {
  const stats = applyStats(pet.stats, change)
  const leveled = addXp({ ...pet, stats }, xp)
  const next = { ...replacePet(state, leveled.pet), coins: state.coins + coins + leveled.bonus }
  return emit(next, pet.id, {
    kind,
    deltas: diff(pet.stats, stats),
    xp,
    coins: coins + leveled.bonus,
    levelUp: leveled.levelUp,
    ...extra,
  })
}

// ---- Actions (all act on the active pet) ---------------------------------------------------

export const FULL_THRESHOLD = 95
export const PLAY_ENERGY = 15
export const FETCH_ENERGY = 20

export function feed(state: GameState, food: FoodId): GameState {
  const pet = activePet(state)
  if (pet.sleeping) return refuse(state, 'asleep')
  if (state.inventory[food] <= 0) return refuse(state, 'noFood')
  if (pet.stats.fullness >= FULL_THRESHOLD) return refuse(state, 'full')
  const info = FOODS[food]
  const withItem = { ...state, inventory: { ...state.inventory, [food]: state.inventory[food] - 1 } }
  return resolve(withItem, pet, 'feed', info.effect, info.xp, 0, { food })
}

const CARE: Record<CareAction, { change: Partial<Stats>; xp: number; coins: number; minEnergy: number }> = {
  pet: { change: { happiness: 8, bond: 4 }, xp: 4, coins: 0, minEnergy: 0 },
  play: { change: { happiness: 14, bond: 3, energy: -12, fullness: -5 }, xp: 10, coins: 2, minEnergy: PLAY_ENERGY },
  fetch: { change: { happiness: 18, bond: 5, energy: -16, fullness: -6 }, xp: 12, coins: 3, minEnergy: FETCH_ENERGY },
}

export function care(state: GameState, action: CareAction, now: number): GameState {
  const pet = activePet(state)
  if (pet.sleeping) return refuse(state, 'asleep')
  const def = CARE[action]
  if (pet.stats.energy < def.minEnergy) return refuse(state, 'tooTired')
  const recent = pet.recent[action].filter((t) => now - t < RECENT_WINDOW_MS)
  const factor = REPEAT_FACTORS[recent.length] ?? MIN_FACTOR
  const withRecent = { ...pet, recent: { ...pet.recent, [action]: [...recent, now] } }
  return resolve(state, withRecent, action, scaleGains(def.change, factor), Math.round(def.xp * factor), factor < 1 ? 0 : def.coins, {
    diminished: factor < 1,
  })
}

export function sleep(state: GameState): GameState {
  const pet = activePet(state)
  if (pet.sleeping) return state
  return emit(replacePet(state, { ...pet, sleeping: true }), pet.id, { kind: 'sleep' })
}

function wakePet(state: GameState, petId: string, rested: boolean): GameState {
  const pet = state.pets.find((p) => p.id === petId)
  if (!pet?.sleeping) return state
  return emit(replacePet(state, { ...pet, sleeping: false }), pet.id, { kind: 'wake', rested })
}

export function wake(state: GameState): GameState {
  const pet = activePet(state)
  return wakePet(state, pet.id, pet.stats.energy >= 100)
}

export function adopt(state: GameState, newPet: NewPet): GameState {
  if (state.pets.length >= MAX_PETS) return refuse(state, 'houseFull')
  const pet = createPet(newPet)
  return emit({ ...state, pets: [...state.pets, pet], activeId: pet.id }, pet.id, { kind: 'adopt' })
}

export function switchPet(state: GameState, petId: string): GameState {
  if (petId === state.activeId || !state.pets.some((p) => p.id === petId)) return state
  return emit({ ...state, activeId: petId }, petId, { kind: 'switch' })
}

// ---- Reducer ------------------------------------------------------------------------------

export type GameAction =
  | { type: 'tick'; now: number }
  | { type: 'feed'; food: FoodId; now: number }
  | { type: 'care'; action: CareAction; now: number }
  | { type: 'sleep'; now: number }
  | { type: 'wake'; now: number }
  | { type: 'adopt'; pet: NewPet; now: number }
  | { type: 'switch'; petId: string; now: number }

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Bring time-based stats up to date before applying any action.
  const current = tick(state, action.now)
  switch (action.type) {
    case 'tick':
      return current
    case 'feed':
      return feed(current, action.food)
    case 'care':
      return care(current, action.action, action.now)
    case 'sleep':
      return sleep(current)
    case 'wake':
      return wake(current)
    case 'adopt':
      return adopt(current, action.pet)
    case 'switch':
      return switchPet(current, action.petId)
  }
}

// ---- Presentation helpers -----------------------------------------------------------------

/** A pet's resting mood from its needs (reactions temporarily override this in the UI). */
export function restingMood(pet: PetState): PetMood {
  if (pet.sleeping) return 'sleeping'
  const s = pet.stats
  if (s.fullness < 25) return 'hungry'
  if (s.energy < 20 || s.health < 35) return 'tired'
  return 'idle'
}
