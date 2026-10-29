import { addStats, addXp, applyStats, clamp, emit, refuse, replacePet } from './core'
import type { CompanionMode, GameState, PetState, StudyConfig, StudyLog, StudySession } from './state'

/**
 * Study (Pomodoro) rules. Everything runs off timestamps, so a session keeps correct time
 * through hidden tabs and sleeping laptops: each tick simply catches up on missed phase changes.
 */

export const FOCUS_PRESETS = [15, 25, 45, 60]
export const BREAK_PRESETS = [5, 10, 15]
export const FOCUS_MIN = 5
export const FOCUS_MAX = 90
export const MAX_ROUNDS = 4

/** One coin per this many focused minutes. */
export const MINUTES_PER_COIN = 5
/** Focused minutes per day that still earn coins. Minutes beyond this are logged but unrewarded. */
export const DAILY_REWARD_MINUTES = 240
/** XP each companion earns per focused minute. */
export const XP_PER_MINUTE = 0.6
export const BOND_PER_ROUND = 2
/** Companion gains per focused minute. */
export const NAP_ENERGY_PER_MIN = 8
export const HANG_HAPPINESS_PER_MIN = 0.4

const MIN = 60_000

/** Local calendar day for a timestamp, used for "today" and streaks. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayKey(new Date(y!, m! - 1, d! - 1, 12).getTime())
}

/** Resets the "today" counters when the date has changed. */
export function logForToday(log: StudyLog, now: number): StudyLog {
  const today = dayKey(now)
  return log.day === today ? log : { ...log, day: today, minutesToday: 0, rewardedToday: 0 }
}

export function clampConfig(c: StudyConfig): StudyConfig {
  return {
    focusMin: Math.round(Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, c.focusMin))),
    breakMin: Math.round(Math.min(30, Math.max(1, c.breakMin))),
    rounds: Math.round(Math.min(MAX_ROUNDS, Math.max(1, c.rounds))),
  }
}

/** Pets keeping you company: their needs don't drop while the session lasts. */
export function studyCompanions(state: GameState): Map<string, CompanionMode> {
  const s = state.study
  if (!s || s.phase === 'done') return new Map()
  return new Map(s.companions.map((c) => [c.petId, c.mode]))
}

export function startStudy(state: GameState, config: StudyConfig, companions: { petId: string; mode: CompanionMode }[], now: number): GameState {
  if (state.walk || (state.study && state.study.phase !== 'done')) return refuse(state, 'cantStudy')
  const valid = companions.filter((c) => state.pets.some((p) => p.id === c.petId))
  const cfg = clampConfig(config)
  const session: StudySession = {
    config: cfg,
    companions: valid,
    startedAt: now,
    phase: 'focus',
    round: 1,
    phaseStartedAt: now,
    phaseEndsAt: now + cfg.focusMin * MIN,
    pausedAt: null,
    completedRounds: 0,
    focusedMinutes: 0,
    coins: 0,
    xp: 0,
    gains: Object.fromEntries(valid.map((c) => [c.petId, {}])),
    endedEarly: false,
  }
  return emit({ ...state, study: session, studyLog: logForToday(state.studyLog, now) }, state.activeId, { kind: 'study', studyPhase: 'focus' })
}

export function pauseStudy(state: GameState, now: number): GameState {
  const s = state.study
  if (!s || s.phase === 'done' || s.pausedAt !== null) return state
  return { ...state, study: { ...s, pausedAt: now } }
}

export function resumeStudy(state: GameState, now: number): GameState {
  const s = state.study
  if (!s || s.pausedAt === null) return state
  const paused = now - s.pausedAt
  return { ...state, study: { ...s, pausedAt: null, phaseStartedAt: s.phaseStartedAt + paused, phaseEndsAt: s.phaseEndsAt + paused } }
}

/** Gentle gains for companions during focus time (called from the main tick). */
export function companionGains(pet: PetState, mode: CompanionMode, minutes: number): { pet: PetState; change: { energy?: number; happiness?: number } } {
  const change = mode === 'nap' ? { energy: NAP_ENERGY_PER_MIN * minutes } : { happiness: HANG_HAPPINESS_PER_MIN * minutes }
  const stats = { ...pet.stats }
  if (change.energy) stats.energy = clamp(stats.energy + change.energy)
  if ('happiness' in change && change.happiness) stats.happiness = clamp(stats.happiness + change.happiness)
  return { pet: { ...pet, stats }, change }
}

/** Rewards for one completed focus round. */
function completeRound(state: GameState, now: number): GameState {
  const s = state.study!
  const minutes = s.config.focusMin
  let log = logForToday(state.studyLog, now)
  const today = log.day
  const streak = log.lastStudyDay === today ? log.streak : log.lastStudyDay === previousDay(today) ? log.streak + 1 : 1
  const rewardable = Math.max(0, Math.min(minutes, DAILY_REWARD_MINUTES - log.rewardedToday))
  const coins = Math.floor(rewardable / MINUTES_PER_COIN)
  log = {
    ...log,
    minutesToday: log.minutesToday + minutes,
    rewardedToday: log.rewardedToday + rewardable,
    totalMinutes: log.totalMinutes + minutes,
    streak,
    lastStudyDay: today,
  }

  const xp = Math.round(minutes * XP_PER_MINUTE * (rewardable / minutes))
  let next: GameState = state
  let levelCoins = 0
  const gains = { ...s.gains }
  for (const c of s.companions) {
    const pet = next.pets.find((p) => p.id === c.petId)
    if (!pet) continue
    const stats = applyStats(pet.stats, { bond: BOND_PER_ROUND })
    const leveled = addXp({ ...pet, stats }, xp)
    levelCoins += leveled.bonus
    gains[c.petId] = addStats(gains[c.petId] ?? {}, { bond: BOND_PER_ROUND })
    next = replacePet(next, leveled.pet)
  }
  return {
    ...next,
    coins: next.coins + coins + levelCoins,
    studyLog: log,
    study: { ...s, completedRounds: s.completedRounds + 1, focusedMinutes: s.focusedMinutes + minutes, coins: s.coins + coins + levelCoins, xp: s.xp + xp, gains },
  }
}

/** Catches up on any phase changes that are due. May pass several if the device was asleep. */
export function advanceStudy(state: GameState, now: number): GameState {
  let next = state
  for (let guard = 0; guard < 2 * MAX_ROUNDS + 1; guard++) {
    const s = next.study
    if (!s || s.phase === 'done' || s.pausedAt !== null || now < s.phaseEndsAt) break
    const at = s.phaseEndsAt
    if (s.phase === 'focus') {
      next = completeRound(next, at)
      const done = next.study!
      if (done.round >= done.config.rounds) {
        next = emit({ ...next, study: { ...done, phase: 'done', phaseStartedAt: at, phaseEndsAt: at } }, next.activeId, { kind: 'study', studyPhase: 'done' })
      } else {
        next = emit({ ...next, study: { ...done, phase: 'break', phaseStartedAt: at, phaseEndsAt: at + done.config.breakMin * MIN } }, next.activeId, {
          kind: 'study',
          studyPhase: 'break',
        })
      }
    } else {
      next = emit({ ...next, study: { ...s, phase: 'focus', round: s.round + 1, phaseStartedAt: at, phaseEndsAt: at + s.config.focusMin * MIN } }, next.activeId, {
        kind: 'study',
        studyPhase: 'focus',
      })
    }
  }
  return next
}

/** Ends a break early and starts the next focus round now. */
export function skipBreak(state: GameState, now: number): GameState {
  const s = state.study
  if (!s || s.phase !== 'break') return state
  return advanceStudy({ ...state, study: { ...s, pausedAt: null, phaseEndsAt: now } }, now)
}

/** Stops the session. A focus round in progress doesn't count; completed rounds keep their rewards. */
export function endStudy(state: GameState, now: number): GameState {
  const s = state.study
  if (!s || s.phase === 'done') return state
  const endedEarly = s.phase === 'focus' || s.round < s.config.rounds
  return emit({ ...state, study: { ...s, phase: 'done', pausedAt: null, phaseEndsAt: now, endedEarly } }, state.activeId, { kind: 'study', studyPhase: 'done' })
}

/** Dismisses the summary. */
export function closeStudy(state: GameState): GameState {
  return state.study?.phase === 'done' ? { ...state, study: null } : state
}

/** Milliseconds left in the current phase. */
export function phaseRemaining(session: StudySession, now: number): number {
  const at = session.pausedAt ?? now
  return Math.max(0, session.phaseEndsAt - at)
}
