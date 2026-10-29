import { addStats, addXp, applyStats, clamp, diff, emit, refuse, repeatFactor, replacePet, scaleGains } from './core'
import { FOODS, type FoodId } from './items'
import {
  activePet,
  createPet,
  MAX_PETS,
  type CareAction,
  type CompanionMode,
  type StudyConfig,
  type GameEvent,
  type GameState,
  type NewPet,
  type PetState,
  type RouteId,
  type Stats,
  type TogetherGame,
  type WalkEventKind,
} from './state'
import type { PetMood } from './types'
import { advanceStudy, closeStudy, companionGains, endStudy, pauseStudy, resumeStudy, skipBreak, startStudy, studyCompanions } from './study'
import { dinner, napEffects, napTogether, playTogether, SNUGGLE_ENERGY_BOOST, socialize } from './together'
import { closeWalk, finishWalk, startWalk, walkEvent } from './walk'

export { clamp, xpToNext, levelReward } from './core'

/**
 * Pure game rules. Every function takes the current state (and the time) and returns a new state,
 * so the rules can be unit-tested and later run on a server without changes.
 */

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

function tickPet(pet: PetState, minutes: number, snuggling = false): PetState {
  const s = pet.stats
  const r = pet.sleeping ? RATES.asleep : RATES.awake
  const energyRate = snuggling ? r.energy * SNUGGLE_ENERGY_BOOST : r.energy

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
      energy: decayTo(s.energy, energyRate, minutes, DECAY_FLOOR),
      health: decayTo(s.health, healthRate, minutes, HEALTH_FLOOR),
    },
  }
}

/** Every pet in the household lives on, whether or not it is the one on screen. */
export function tick(state: GameState, now: number): GameState {
  const elapsed = Math.min(Math.max(0, now - state.lastTick), MAX_ELAPSED_MS)
  if (elapsed < 250) return state
  const minutes = elapsed / 60000
  // Pets napping alongside a pal rest faster, and napping together grows friendship.
  const nap = napEffects(state, minutes)
  // Study companions don't decline while you study; during focus time they gain a little instead.
  const companions = studyCompanions(state)
  const focusing = state.study?.phase === 'focus' && state.study.pausedAt === null
  let study = state.study
  const pets = state.pets.map((p) => {
    const mode = companions.get(p.id)
    if (!mode) return tickPet(p, minutes, nap.energyBoost.has(p.id))
    if (!focusing || !study) return p
    const gained = companionGains(p, mode, minutes)
    study = { ...study, gains: { ...study.gains, [p.id]: addStats(study.gains[p.id] ?? {}, gained.change) } }
    return gained.pet
  })
  let next: GameState = { ...nap.next, lastTick: now, pets, study }

  // Sleeping pets wake up on their own once fully rested.
  for (const pet of next.pets) {
    if (pet.sleeping && pet.stats.energy >= 100) next = wakePet(next, pet.id, true)
  }
  return advanceStudy(next, now)
}

// ---- Helpers ------------------------------------------------------------------------------

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
  const { recent, factor } = repeatFactor(pet.recent[action], now)
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
  | { type: 'care'; action: CareAction; now: number; petId?: string }
  | { type: 'sleep'; now: number }
  | { type: 'wake'; now: number }
  | { type: 'adopt'; pet: NewPet; now: number }
  | { type: 'switch'; petId: string; now: number }
  | { type: 'startWalk'; petIds: string[]; route: RouteId; now: number }
  | { type: 'walkEvent'; kind: WalkEventKind; food?: FoodId; now: number }
  | { type: 'finishWalk'; now: number }
  | { type: 'closeWalk'; now: number }
  | { type: 'playTogether'; buddyId: string; game: TogetherGame; now: number }
  | { type: 'napTogether'; petIds: string[]; now: number }
  | { type: 'dinner'; now: number }
  | { type: 'socialize'; a: string; b: string; now: number }
  | { type: 'startStudy'; config: StudyConfig; companions: { petId: string; mode: CompanionMode }[]; now: number }
  | { type: 'pauseStudy'; now: number }
  | { type: 'resumeStudy'; now: number }
  | { type: 'skipBreak'; now: number }
  | { type: 'endStudy'; now: number }
  | { type: 'closeStudy'; now: number }

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Bring time-based stats up to date before applying any action.
  const current = tick(state, action.now)
  switch (action.type) {
    case 'tick':
      return current
    case 'feed':
      return feed(current, action.food)
    case 'care':
      // Caring for a specific pet (e.g. a pat during a study break) makes it the one on stage.
      return care(action.petId && current.pets.some((p) => p.id === action.petId) ? { ...current, activeId: action.petId } : current, action.action, action.now)
    case 'sleep':
      return sleep(current)
    case 'wake':
      return wake(current)
    case 'adopt':
      return adopt(current, action.pet)
    case 'switch':
      return switchPet(current, action.petId)
    case 'startWalk':
      return startWalk(current, action.petIds, action.route, action.now)
    case 'walkEvent':
      return walkEvent(current, action.kind, action.food)
    case 'finishWalk':
      return finishWalk(current, action.now)
    case 'closeWalk':
      return closeWalk(current)
    case 'playTogether':
      return playTogether(current, action.buddyId, action.game, action.now)
    case 'napTogether':
      return napTogether(current, action.petIds)
    case 'dinner':
      return dinner(current)
    case 'socialize':
      return socialize(current, action.a, action.b)
    case 'startStudy':
      return startStudy(current, action.config, action.companions, action.now)
    case 'pauseStudy':
      return pauseStudy(current, action.now)
    case 'resumeStudy':
      return resumeStudy(current, action.now)
    case 'skipBreak':
      return skipBreak(current, action.now)
    case 'endStudy':
      return endStudy(current, action.now)
    case 'closeStudy':
      return closeStudy(current)
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
