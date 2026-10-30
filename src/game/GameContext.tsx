import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { parseSave, SAVE_KEY, saveGame } from '../storage/save'
import type { FoodId } from './items'
import { gameReducer } from './logic'
import type { Accessory } from './types'
import type { CareAction, CompanionMode, GameState, NewPet, RouteId, StudyConfig, TogetherGame, WalkEventKind } from './state'

type GameApi = {
  state: GameState
  feed: (food: FoodId) => void
  care: (action: CareAction) => void
  sleep: () => void
  wake: () => void
  adopt: (pet: NewPet) => void
  switchPet: (petId: string) => void
  startWalk: (petIds: string[], route: RouteId) => void
  walkEvent: (kind: WalkEventKind, food?: FoodId) => void
  finishWalk: () => void
  closeWalk: () => void
  playTogether: (buddyId: string, game: TogetherGame) => void
  napTogether: (petIds: string[]) => void
  dinner: () => void
  socialize: (a: string, b: string) => void
  /** Care for a specific pet, making it the one on stage. */
  careFor: (petId: string, action: CareAction) => void
  startStudy: (config: StudyConfig, companions: { petId: string; mode: CompanionMode }[]) => void
  pauseStudy: () => void
  resumeStudy: () => void
  skipBreak: () => void
  endStudy: () => void
  closeStudy: () => void
  buy: (itemId: string, quantity?: number) => void
  equip: (petId: string, accessory: Accessory | null) => void
}

const GameContext = createContext<GameApi | null>(null)

const TICK_MS = 1000

type GameProviderProps = {
  initial: GameState
  /** Save every change to localStorage. Off in tests and dev galleries. */
  persist?: boolean
  /** Another tab started a new game. */
  onCleared?: () => void
  children: ReactNode
}

export function GameProvider({ initial, persist = false, onCleared, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initial)
  // Set when the state was just loaded from another tab, so it isn't written straight back.
  const fromOutside = useRef(false)
  const clearedRef = useRef(onCleared)
  clearedRef.current = onCleared

  useEffect(() => {
    if (!persist) return
    if (fromOutside.current) {
      fromOutside.current = false
      return
    }
    saveGame(state)
  }, [persist, state])

  // With the game open in two tabs, follow whichever one changed last instead of overwriting it.
  useEffect(() => {
    if (!persist) return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SAVE_KEY && e.key !== null) return
      const next = parseSave(e.newValue)
      if (!next) {
        if (e.newValue === null) clearedRef.current?.()
        return
      }
      fromOutside.current = true
      dispatch({ type: 'load', state: next, now: Date.now() })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [persist])

  // Time keeps passing while the game is open.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Actions never change identity, so effects and timers that use them don't restart on every tick.
  const actions = useMemo<Omit<GameApi, 'state'>>(
    () => ({
      feed: (food) => dispatch({ type: 'feed', food, now: Date.now() }),
      care: (action) => dispatch({ type: 'care', action, now: Date.now() }),
      sleep: () => dispatch({ type: 'sleep', now: Date.now() }),
      wake: () => dispatch({ type: 'wake', now: Date.now() }),
      adopt: (pet) => dispatch({ type: 'adopt', pet, now: Date.now() }),
      switchPet: (petId) => dispatch({ type: 'switch', petId, now: Date.now() }),
      startWalk: (petIds, route) => dispatch({ type: 'startWalk', petIds, route, now: Date.now() }),
      walkEvent: (kind, food) => dispatch({ type: 'walkEvent', kind, food, now: Date.now() }),
      finishWalk: () => dispatch({ type: 'finishWalk', now: Date.now() }),
      closeWalk: () => dispatch({ type: 'closeWalk', now: Date.now() }),
      playTogether: (buddyId, game) => dispatch({ type: 'playTogether', buddyId, game, now: Date.now() }),
      napTogether: (petIds) => dispatch({ type: 'napTogether', petIds, now: Date.now() }),
      dinner: () => dispatch({ type: 'dinner', now: Date.now() }),
      socialize: (a, b) => dispatch({ type: 'socialize', a, b, now: Date.now() }),
      careFor: (petId, action) => dispatch({ type: 'care', action, petId, now: Date.now() }),
      startStudy: (config, companions) => dispatch({ type: 'startStudy', config, companions, now: Date.now() }),
      pauseStudy: () => dispatch({ type: 'pauseStudy', now: Date.now() }),
      resumeStudy: () => dispatch({ type: 'resumeStudy', now: Date.now() }),
      skipBreak: () => dispatch({ type: 'skipBreak', now: Date.now() }),
      endStudy: () => dispatch({ type: 'endStudy', now: Date.now() }),
      closeStudy: () => dispatch({ type: 'closeStudy', now: Date.now() }),
      buy: (itemId, quantity) => dispatch({ type: 'buy', itemId, quantity, now: Date.now() }),
      equip: (petId, accessory) => dispatch({ type: 'equip', petId, accessory, now: Date.now() }),
    }),
    [],
  )
  const api = useMemo<GameApi>(() => ({ state, ...actions }), [state, actions])

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
