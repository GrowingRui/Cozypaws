import { describe, expect, it } from 'vitest'
import { gameReducer } from '../game/logic'
import { createGame, type GameState } from '../game/state'
import { exportCode, importCode, parseSave } from './save'

const T0 = 1_000_000
const MIN = 60_000

const file = (state: unknown, version = 2) => JSON.stringify({ version, savedAt: T0, state })

function home(): GameState {
  let g = createGame({ id: 'a', species: 'horse', name: 'Clover' }, T0)
  g = gameReducer(g, { type: 'adopt', pet: { id: 'b', species: 'bunny', name: 'Mochi' }, now: T0 })
  return g
}

describe('parseSave', () => {
  it('round-trips a household, dropping the last reaction', () => {
    const g = home()
    expect(g.event).not.toBeNull()
    const loaded = parseSave(file(g))!
    expect(loaded).toEqual({ ...g, event: null })
  })

  it('rejects missing, broken, wrong-version and petless saves', () => {
    expect(parseSave(null)).toBeNull()
    expect(parseSave('{not json')).toBeNull()
    expect(parseSave(file(home(), 1))).toBeNull()
    expect(parseSave(file({ ...home(), pets: [] }))).toBeNull()
    expect(parseSave(file({ ...home(), pets: [{ name: 'No id' }] }))).toBeNull()
  })

  it('fills in fields missing from an older save', () => {
    const g = home()
    const { owned: _owned, studyLog: _log, ...older } = g
    const pets = g.pets.map(({ recent: _recent, ...p }) => ({ ...p, stats: { fullness: 40 } }))
    const loaded = parseSave(file({ ...older, pets, activeId: 'gone' }))!
    expect(loaded.owned).toEqual({ accessories: [], toys: [], decor: [] })
    expect(loaded.studyLog.streak).toBe(0)
    expect(loaded.pets[0]!.stats).toMatchObject({ fullness: 40, energy: 80 })
    expect(loaded.pets[0]!.recent.pet).toEqual([])
    expect(loaded.activeId).toBe('a')
  })

  it('finishes a walk whose time ran out while the game was closed', () => {
    let g = gameReducer(home(), { type: 'startWalk', petIds: ['a'], route: 'stroll', now: T0 })
    expect(g.walk).not.toBeNull()
    g = parseSave(file(g))!
    expect(g.walk?.startedAt).toBe(T0)
    g = gameReducer(g, { type: 'finishWalk', now: T0 + 60 * MIN })
    expect(g.walk?.summary).toBeDefined()
  })

  it('catches a study session up on the phases it missed', () => {
    let g = gameReducer(home(), {
      type: 'startStudy',
      config: { focusMin: 25, breakMin: 5, rounds: 2 },
      companions: [{ petId: 'a', mode: 'hang' }],
      now: T0,
    })
    g = parseSave(file(g))!
    g = gameReducer(g, { type: 'tick', now: T0 + 27 * MIN })
    expect(g.study?.phase).toBe('break')
    expect(g.study?.completedRounds).toBe(1)
  })
})

describe('save codes', () => {
  it('round-trip a household, names with any characters included', () => {
    const g = gameReducer(home(), { type: 'adopt', pet: { id: 'c', species: 'kitten', name: '小花 🌸' }, now: T0 })
    expect(importCode(exportCode(g))).toEqual({ ...g, event: null })
  })

  it('survive spaces and line breaks added when pasting', () => {
    const code = exportCode(home())
    const mangled = `  ${code.slice(0, 20)}\n${code.slice(20, 50)} ${code.slice(50)}\n`
    expect(importCode(mangled)).toEqual({ ...home(), event: null })
  })

  it('reject anything that is not a save code', () => {
    expect(importCode('')).toBeNull()
    expect(importCode('hello')).toBeNull()
    expect(importCode('COZYPAWS-not base64!!')).toBeNull()
    expect(importCode('COZYPAWS-' + btoa('{"version":2}'))).toBeNull()
  })
})
