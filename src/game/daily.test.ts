import { describe, expect, it } from 'vitest'
import { BONUS_FOOD, GOALS, pickGoals, type DailyGoal, type GoalKind } from './daily'
import { gameReducer } from './logic'
import { createGame, createPet, type GameState } from './state'

// Noon on a fixed local date, so "today" never flips mid-test.
const T0 = new Date(2026, 9, 30, 12).getTime()
const DAY = 24 * 60 * 60 * 1000

const fresh = (): GameState => gameReducer(createGame({ id: 'a', species: 'puppy', name: 'Biscuit' }, T0), { type: 'tick', now: T0 })
const withGoals = (state: GameState, kinds: GoalKind[]): GameState => ({
  ...state,
  daily: { ...state.daily, goals: kinds.map((kind): DailyGoal => ({ kind, ...GOALS[kind], progress: 0, claimed: false })) },
})
const goal = (state: GameState, kind: GoalKind) => state.daily.goals.find((g) => g.kind === kind)!

describe('daily goals', () => {
  it('picks three goals for today: a care goal, an outing and one more', () => {
    const g = fresh()
    expect(g.daily.day).toBe('2026-10-30')
    expect(g.daily.goals).toHaveLength(3)
    expect(['feed', 'pat', 'play', 'nap']).toContain(g.daily.goals[0]!.kind)
    expect(['walk', 'study']).toContain(g.daily.goals[1]!.kind)
    expect(new Set(g.daily.goals.map((x) => x.kind)).size).toBe(3)
  })

  it('picks the same goals for the same day, and only suggests doing things together with two pets', () => {
    expect(pickGoals('2026-10-30', 1)).toEqual(pickGoals('2026-10-30', 1))
    for (let d = 1; d <= 28; d++) {
      const kinds = pickGoals(`2026-02-${String(d).padStart(2, '0')}`, 1).map((x) => x.kind)
      expect(kinds).not.toContain('together')
    }
  })

  it('brings a fresh set on a new day', () => {
    const g = withGoals(fresh(), ['pat', 'walk', 'feed'])
    const tomorrow = gameReducer(g, { type: 'tick', now: T0 + DAY })
    expect(tomorrow.daily.day).toBe('2026-10-31')
    expect(tomorrow.daily.goals.every((x) => x.progress === 0 && !x.claimed)).toBe(true)
  })

  it('counts each action once and stops at the target', () => {
    let g = withGoals(fresh(), ['pat', 'walk', 'feed'])
    for (let i = 0; i < 7; i++) g = gameReducer(g, { type: 'care', action: 'pet', now: T0 + i * 1000 })
    expect(goal(g, 'pat').progress).toBe(GOALS.pat.target)
    // A tick on its own doesn't count as another pat.
    g = gameReducer(g, { type: 'tick', now: T0 + 60_000 })
    expect(goal(g, 'pat').progress).toBe(GOALS.pat.target)
    expect(goal(g, 'feed').progress).toBe(0)
  })

  it('counts refusals as nothing', () => {
    let g = withGoals(fresh(), ['feed', 'walk', 'pat'])
    g = { ...g, inventory: { kibble: 0, cookie: 0, veggies: 0, smoothie: 0, cake: 0 } }
    g = gameReducer(g, { type: 'feed', food: 'kibble', now: T0 + 1000 })
    expect(g.event?.kind).toBe('refuse')
    expect(goal(g, 'feed').progress).toBe(0)
  })

  it('counts dinner as feeding everyone, and as doing something together', () => {
    let g = fresh()
    g = { ...g, pets: [...g.pets, createPet({ id: 'b', species: 'kitten', name: 'Mochi' })] }
    g = g.pets.reduce((s, p) => ({ ...s, pets: s.pets.map((q) => (q.id === p.id ? { ...q, stats: { ...q.stats, fullness: 30 } } : q)) }), g)
    g = withGoals(g, ['feed', 'walk', 'together'])
    g = gameReducer(g, { type: 'dinner', now: T0 + 1000 })
    expect(g.event?.kind).toBe('dinner')
    expect(goal(g, 'feed').progress).toBe(2)
    expect(goal(g, 'together').progress).toBe(1)
  })

  it('follows study minutes from the study log', () => {
    let g = withGoals(fresh(), ['pat', 'study', 'feed'])
    g = { ...g, studyLog: { ...g.studyLog, day: '2026-10-30', minutesToday: 15 } }
    g = gameReducer(g, { type: 'tick', now: T0 + 1000 })
    expect(goal(g, 'study').progress).toBe(15)
  })

  it('pays coins once when a finished goal is claimed', () => {
    let g = withGoals(fresh(), ['nap', 'walk', 'feed'])
    g = gameReducer(g, { type: 'claimGoal', index: 0, now: T0 + 500 })
    expect(g.coins).toBe(30)
    g = gameReducer(g, { type: 'sleep', now: T0 + 1000 })
    expect(goal(g, 'nap').progress).toBe(1)
    g = gameReducer(g, { type: 'claimGoal', index: 0, now: T0 + 2000 })
    expect(g.coins).toBe(30 + GOALS.nap.coins)
    expect(g.event?.kind).toBe('goal')
    g = gameReducer(g, { type: 'claimGoal', index: 0, now: T0 + 3000 })
    expect(g.coins).toBe(30 + GOALS.nap.coins)
  })

  it('adds a treat when every goal of the day is claimed', () => {
    let g = withGoals(fresh(), ['nap', 'walk', 'feed'])
    g = { ...g, daily: { ...g.daily, goals: g.daily.goals.map((x) => ({ ...x, progress: x.target })) } }
    const cakes = g.inventory[BONUS_FOOD]
    g = gameReducer(g, { type: 'claimGoal', index: 0, now: T0 + 1000 })
    g = gameReducer(g, { type: 'claimGoal', index: 1, now: T0 + 2000 })
    expect(g.inventory[BONUS_FOOD]).toBe(cakes)
    g = gameReducer(g, { type: 'claimGoal', index: 2, now: T0 + 3000 })
    expect(g.inventory[BONUS_FOOD]).toBe(cakes + 1)
    expect(g.event?.food).toBe(BONUS_FOOD)
    expect(g.daily.bonusClaimed).toBe(true)
  })
})
