import { STAT_KEYS, type GameEvent, type GameState, type PetState, type Stats } from './state'

/** Small building blocks shared by all game rules. */

export const clamp = (v: number) => Math.max(0, Math.min(100, v))

export function applyStats(stats: Stats, change: Partial<Stats>): Stats {
  const next = { ...stats }
  for (const k of STAT_KEYS) if (change[k] !== undefined) next[k] = clamp(next[k] + change[k]!)
  return next
}

/** Rounded, non-zero differences between two stat sets. */
export function diff(before: Stats, after: Stats): Partial<Stats> {
  const out: Partial<Stats> = {}
  for (const k of STAT_KEYS) {
    const d = Math.round(after[k]) - Math.round(before[k])
    if (d !== 0) out[k] = d
  }
  return out
}

export function scaleStats(change: Partial<Stats>, factor: number): Partial<Stats> {
  const out: Partial<Stats> = {}
  for (const k of STAT_KEYS) if (change[k] !== undefined) out[k] = Math.round(change[k]! * factor)
  return out
}

export function addStats(a: Partial<Stats>, b: Partial<Stats>): Partial<Stats> {
  const out: Partial<Stats> = { ...a }
  for (const k of STAT_KEYS) if (b[k] !== undefined) out[k] = (out[k] ?? 0) + b[k]!
  return out
}

export const xpToNext = (level: number) => 40 + (level - 1) * 20
export const levelReward = (level: number) => 20 + level * 5

/** Adds xp to a pet; level-up coin rewards are returned as `bonus` for the shared purse. */
export function addXp(pet: PetState, xp: number): { pet: PetState; levelUp?: number; bonus: number } {
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

export function replacePet(state: GameState, pet: PetState): GameState {
  return { ...state, pets: state.pets.map((p) => (p.id === pet.id ? pet : p)) }
}

type EventInput = Omit<GameEvent, 'id' | 'petId' | 'deltas' | 'xp' | 'coins'> & Partial<Pick<GameEvent, 'deltas' | 'xp' | 'coins'>>

export function emit(state: GameState, petId: string, event: EventInput): GameState {
  const id = state.eventSeq + 1
  return { ...state, eventSeq: id, event: { deltas: {}, xp: 0, coins: 0, ...event, id, petId } }
}

export function refuse(state: GameState, reason: GameEvent['reason']): GameState {
  return emit(state, state.activeId, { kind: 'refuse', reason })
}

const RECENT_WINDOW_MS = 60_000
/** Gain multiplier for the nth repeat of the same action within a minute. */
const REPEAT_FACTORS = [1, 1, 0.7, 0.5, 0.3]
const MIN_FACTOR = 0.2

/** Drops old timestamps and returns how much a repeated action should still give. */
export function repeatFactor(times: number[], now: number): { recent: number[]; factor: number } {
  const recent = times.filter((t) => now - t < RECENT_WINDOW_MS)
  return { recent, factor: REPEAT_FACTORS[recent.length] ?? MIN_FACTOR }
}

/** Scales positive gains; costs (negative values) always apply in full. */
export function scaleGains(change: Partial<Stats>, factor: number): Partial<Stats> {
  const out: Partial<Stats> = {}
  for (const k of STAT_KEYS) {
    const v = change[k]
    if (v !== undefined) out[k] = v > 0 ? Math.round(v * factor) : v
  }
  return out
}
