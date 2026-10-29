import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { FoodId } from './items'
import { gameReducer } from './logic'
import type { CareAction, GameState, NewPet, RouteId, WalkEventKind } from './state'

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
}

const GameContext = createContext<GameApi | null>(null)

const TICK_MS = 1000

export function GameProvider({ initial, children }: { initial: GameState; children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initial)

  // Time keeps passing while the game is open.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const api = useMemo<GameApi>(
    () => ({
      state,
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
    }),
    [state],
  )

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
