import { emit } from './core'
import type { FoodId } from './items'
import type { GameEvent, GameState } from './state'
import { dayKey } from './study'

/**
 * Daily goals: three small things to do each day, each worth a few coins once claimed.
 * Progress comes from the game's own events, so any way of doing a thing counts (a pat during
 * a study break is still a pat). A fresh set is picked when the local date changes.
 */

export type GoalKind = 'feed' | 'pat' | 'play' | 'nap' | 'walk' | 'study' | 'together'

export type DailyGoal = {
  kind: GoalKind
  target: number
  progress: number
  coins: number
  claimed: boolean
}

export type DailyGoals = {
  /** Local date (YYYY-MM-DD) these goals belong to. */
  day: string
  goals: DailyGoal[]
  /** Set once all goals are claimed and the bonus treat is handed out. */
  bonusClaimed: boolean
}

type GoalDef = { target: number; coins: number }

export const GOALS: Record<GoalKind, GoalDef> = {
  feed: { target: 3, coins: 8 },
  pat: { target: 5, coins: 6 },
  play: { target: 3, coins: 8 },
  nap: { target: 1, coins: 6 },
  walk: { target: 1, coins: 12 },
  study: { target: 25, coins: 12 },
  together: { target: 2, coins: 10 },
}

/** The treat for finishing every goal of the day. */
export const BONUS_FOOD: FoodId = 'cake'

/** One everyday care goal, one outing, and one more from whatever is left. */
const CARE: GoalKind[] = ['feed', 'pat', 'play', 'nap']
const OUTINGS: GoalKind[] = ['walk', 'study']

/** Small, stable hash of the date, so the same day always picks the same goals. */
function seed(day: string): number {
  let h = 2166136261
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function pickGoals(day: string, petCount: number): DailyGoal[] {
  let s = seed(day)
  const next = (n: number) => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0
    return s % n
  }
  const care = CARE[next(CARE.length)]!
  const outing = OUTINGS[next(OUTINGS.length)]!
  // Doing things together needs a second pet; it's listed twice so households see it more often.
  const rest = [...CARE, ...OUTINGS, ...(petCount > 1 ? (['together', 'together'] as GoalKind[]) : [])].filter(
    (k) => k !== care && k !== outing,
  )
  const third = rest[next(rest.length)]!
  return [care, outing, third].map((kind) => ({ kind, ...GOALS[kind], progress: 0, claimed: false }))
}

export function emptyDaily(): DailyGoals {
  return { day: '', goals: [], bonusClaimed: false }
}

/** Picks a fresh set of goals when the date has changed. */
export function dailyForToday(state: GameState, now: number): GameState {
  const today = dayKey(now)
  if (state.daily.day === today) return state
  return { ...state, daily: { day: today, goals: pickGoals(today, state.pets.length), bonusClaimed: false } }
}

/** How much one event moves a goal of this kind. */
function stepFor(kind: GoalKind, event: GameEvent): number {
  switch (kind) {
    case 'feed':
      return event.kind === 'feed' ? 1 : event.kind === 'dinner' ? (event.petIds?.length ?? 1) : 0
    case 'pat':
      return event.kind === 'pet' ? 1 : 0
    case 'play':
      return ['play', 'fetch', 'feather', 'bubbles', 'together'].includes(event.kind) ? 1 : 0
    case 'nap':
      return event.kind === 'sleep' || event.kind === 'napTogether' ? 1 : 0
    case 'walk':
      return event.kind === 'walk' ? 1 : 0
    case 'together':
      return event.kind === 'together' || event.kind === 'napTogether' || event.kind === 'dinner' ? 1 : 0
    case 'study':
      return 0
  }
}

/**
 * Moves today's goals along after an action. `prev` is the state before it, so a new event
 * (a fresh id) is counted exactly once.
 */
export function trackGoals(prev: GameState, next: GameState): GameState {
  const daily = next.daily
  if (!daily.goals.length) return next
  const event = next.event && next.event.id !== prev.event?.id ? next.event : null
  // Study minutes come from the study log, which keeps its own "today" count.
  const studied = next.studyLog.day === daily.day ? next.studyLog.minutesToday : 0
  let changed = false
  const goals = daily.goals.map((g) => {
    const progress = g.kind === 'study' ? studied : g.progress + (event ? stepFor(g.kind, event) : 0)
    const capped = Math.min(g.target, progress)
    if (capped === g.progress) return g
    changed = true
    return { ...g, progress: capped }
  })
  return changed ? { ...next, daily: { ...daily, goals } } : next
}

export const goalDone = (g: DailyGoal) => g.progress >= g.target

export function claimGoal(state: GameState, index: number): GameState {
  const goal = state.daily.goals[index]
  if (!goal || goal.claimed || !goalDone(goal)) return state
  const goals = state.daily.goals.map((g, i) => (i === index ? { ...g, claimed: true } : g))
  const allDone = goals.every((g) => g.claimed) && !state.daily.bonusClaimed
  const inventory = allDone ? { ...state.inventory, [BONUS_FOOD]: state.inventory[BONUS_FOOD] + 1 } : state.inventory
  const next = { ...state, coins: state.coins + goal.coins, inventory, daily: { ...state.daily, goals, bonusClaimed: state.daily.bonusClaimed || allDone } }
  return emit(next, state.activeId, { kind: 'goal', coins: goal.coins, ...(allDone ? { food: BONUS_FOOD } : {}) })
}
