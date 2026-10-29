import { describe, expect, it } from 'vitest'
import { gameReducer, tick } from './logic'
import { createGame, type GameState, type StudyConfig } from './state'
import { DAILY_REWARD_MINUTES, dayKey, NAP_ENERGY_PER_MIN, phaseRemaining } from './study'

// Noon local time, so day boundaries in tests are predictable.
const T0 = new Date(2026, 9, 29, 12, 0, 0).getTime()
const MIN = 60_000
const SEC = 1000

function home(): GameState {
  let g = createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0)
  g = gameReducer(g, { type: 'adopt', pet: { id: 'b', species: 'kitten', name: 'Mochi' }, now: T0 })
  return gameReducer(g, { type: 'switch', petId: 'a', now: T0 })
}
const start = (g: GameState, config: StudyConfig, now = T0) =>
  gameReducer(g, { type: 'startStudy', config, companions: [{ petId: 'a', mode: 'nap' }, { petId: 'b', mode: 'hang' }], now })
/** Ticks once a second-ish across a span, like the running app. */
function run(g: GameState, from: number, to: number, step = 30 * SEC) {
  for (let t = from + step; t <= to; t += step) g = tick(g, t)
  return tick(g, to)
}
const pet = (g: GameState, id: string) => g.pets.find((p) => p.id === id)!

describe('study sessions', () => {
  it('runs focus, break, focus, then finishes', () => {
    let g = start(home(), { focusMin: 25, breakMin: 5, rounds: 2 })
    expect(g.study).toMatchObject({ phase: 'focus', round: 1 })
    g = run(g, T0, T0 + 25 * MIN)
    expect(g.study).toMatchObject({ phase: 'break', completedRounds: 1 })
    expect(g.event).toMatchObject({ kind: 'study', studyPhase: 'break' })
    g = run(g, T0 + 25 * MIN, T0 + 30 * MIN)
    expect(g.study).toMatchObject({ phase: 'focus', round: 2 })
    g = run(g, T0 + 30 * MIN, T0 + 55 * MIN)
    expect(g.study).toMatchObject({ phase: 'done', completedRounds: 2, focusedMinutes: 50, endedEarly: false })
  })

  it('pays coins and xp only for completed focus rounds', () => {
    let g = start(home(), { focusMin: 25, breakMin: 5, rounds: 2 })
    g = run(g, T0, T0 + 25 * MIN)
    expect(g.coins).toBe(30 + 5)
    expect(pet(g, 'a').xp).toBe(15)
    // Stop halfway through round 2: that round earns nothing.
    g = run(g, T0 + 25 * MIN, T0 + 42 * MIN)
    g = gameReducer(g, { type: 'endStudy', now: T0 + 42 * MIN })
    expect(g.study).toMatchObject({ phase: 'done', completedRounds: 1, endedEarly: true, coins: 5 })
    expect(g.coins).toBe(35)
  })

  it('pausing stops the clock', () => {
    let g = start(home(), { focusMin: 15, breakMin: 5, rounds: 1 })
    g = gameReducer(g, { type: 'pauseStudy', now: T0 + 5 * MIN })
    g = run(g, T0 + 5 * MIN, T0 + 40 * MIN)
    expect(g.study!.phase).toBe('focus')
    expect(phaseRemaining(g.study!, T0 + 40 * MIN)).toBe(10 * MIN)
    g = gameReducer(g, { type: 'resumeStudy', now: T0 + 40 * MIN })
    g = run(g, T0 + 40 * MIN, T0 + 50 * MIN)
    expect(g.study!.phase).toBe('done')
  })

  it('catches up on several phases at once after the device sleeps', () => {
    let g = start(home(), { focusMin: 15, breakMin: 5, rounds: 3 })
    g = tick(g, T0 + 2 * 60 * MIN)
    expect(g.study).toMatchObject({ phase: 'done', completedRounds: 3 })
  })

  it('skipping a break starts the next round right away', () => {
    let g = start(home(), { focusMin: 15, breakMin: 10, rounds: 2 })
    g = run(g, T0, T0 + 15 * MIN)
    g = gameReducer(g, { type: 'skipBreak', now: T0 + 16 * MIN })
    expect(g.study).toMatchObject({ phase: 'focus', round: 2 })
    expect(phaseRemaining(g.study!, T0 + 16 * MIN)).toBe(15 * MIN)
  })

  it('cannot start during a walk', () => {
    let g = gameReducer(home(), { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    g = start(g, { focusMin: 25, breakMin: 5, rounds: 1 })
    expect(g.study).toBeNull()
    expect(g.event).toMatchObject({ reason: 'cantStudy' })
  })

  it('keeps settings within sensible limits', () => {
    const g = start(home(), { focusMin: 300, breakMin: 0, rounds: 9 })
    expect(g.study!.config).toEqual({ focusMin: 90, breakMin: 1, rounds: 4 })
  })
})

describe('companions', () => {
  it('do not get hungry or sad while you study, and gain a little during focus', () => {
    let g = start(home(), { focusMin: 25, breakMin: 5, rounds: 1 })
    const before = pet(g, 'b').stats
    g = run(g, T0, T0 + 10 * MIN)
    expect(pet(g, 'b').stats.fullness).toBeCloseTo(before.fullness)
    expect(pet(g, 'b').stats.happiness).toBeCloseTo(before.happiness + 4)
    expect(pet(g, 'a').stats.energy).toBeCloseTo(Math.min(100, 80 + NAP_ENERGY_PER_MIN * 10))
  })

  it('pets left out of the session carry on as normal', () => {
    let g = gameReducer(home(), { type: 'startStudy', config: { focusMin: 25, breakMin: 5, rounds: 1 }, companions: [{ petId: 'a', mode: 'nap' }], now: T0 })
    g = run(g, T0, T0 + 10 * MIN)
    expect(pet(g, 'b').stats.fullness).toBeCloseTo(70 - 12)
  })
})

describe('study log', () => {
  it('tracks minutes today and caps daily coin rewards', () => {
    let g = home()
    let t = T0
    // 5 sessions of 60 minutes = 300 minutes, beyond the daily cap.
    for (let i = 0; i < 5; i++) {
      g = start(g, { focusMin: 60, breakMin: 5, rounds: 1 }, t)
      g = run(g, t, t + 60 * MIN, 5 * MIN)
      g = gameReducer(g, { type: 'closeStudy', now: t + 60 * MIN })
      t += 61 * MIN
    }
    expect(g.studyLog.minutesToday).toBe(300)
    expect(g.studyLog.rewardedToday).toBe(DAILY_REWARD_MINUTES)
    expect(g.coins - 30).toBeLessThanOrEqual(DAILY_REWARD_MINUTES / 5 + 200)
  })

  it('builds a streak on consecutive days and resets after a gap', () => {
    let g = home()
    const day = (n: number) => T0 + n * 24 * 60 * MIN
    for (const n of [0, 1, 2]) {
      g = start(g, { focusMin: 15, breakMin: 5, rounds: 1 }, day(n))
      g = run(g, day(n), day(n) + 15 * MIN)
      g = gameReducer(g, { type: 'closeStudy', now: day(n) + 16 * MIN })
    }
    expect(g.studyLog.streak).toBe(3)
    expect(g.studyLog.lastStudyDay).toBe(dayKey(day(2)))
    g = start(g, { focusMin: 15, breakMin: 5, rounds: 1 }, day(5))
    g = tick(g, day(5) + 15 * MIN)
    expect(g.studyLog.streak).toBe(1)
    expect(g.studyLog.minutesToday).toBe(15)
  })
})
