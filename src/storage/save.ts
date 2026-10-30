import { createGame, createPet, type GameState, type PetState } from '../game/state'

/**
 * The household is saved to localStorage after every change, so closing the tab never loses progress.
 * Walks and study sessions are stored with real timestamps, so they pick up where they were on reload
 * (or finish, if their time ran out while the game was closed).
 */
export const SAVE_KEY = 'cozypaws:save'

type SaveFile = { version: 2; savedAt: number; state: GameState }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Fills in anything missing from an older or hand-edited save, so the game never starts on half a pet. */
function normalizePet(raw: unknown): PetState | null {
  if (!isObject(raw) || typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.species !== 'string') return null
  const base = createPet({ id: raw.id, name: raw.name, species: raw.species as PetState['species'] })
  return {
    ...base,
    ...raw,
    stats: { ...base.stats, ...(isObject(raw.stats) ? raw.stats : {}) },
    recent: { ...base.recent, ...(isObject(raw.recent) ? raw.recent : {}) },
  } as PetState
}

export function parseSave(text: string | null): GameState | null {
  if (!text) return null
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    return null
  }
  if (!isObject(file) || file.version !== 2 || !isObject(file.state)) return null
  const raw = file.state
  const pets = (Array.isArray(raw.pets) ? raw.pets : []).map(normalizePet).filter((p): p is PetState => !!p)
  if (pets.length === 0) return null

  const base = createGame(pets[0]!, typeof raw.lastTick === 'number' ? raw.lastTick : Date.now())
  const activeId = pets.some((p) => p.id === raw.activeId) ? (raw.activeId as string) : pets[0]!.id
  return {
    ...base,
    ...raw,
    version: 2,
    pets,
    activeId,
    inventory: { ...base.inventory, ...(isObject(raw.inventory) ? raw.inventory : {}) },
    studyLog: { ...base.studyLog, ...(isObject(raw.studyLog) ? raw.studyLog : {}) },
    owned: { ...base.owned, ...(isObject(raw.owned) ? raw.owned : {}) },
    friendships: isObject(raw.friendships) ? raw.friendships : {},
    // Reactions belong to the moment they happened; don't replay them on load.
    event: null,
  } as GameState
}

export function loadGame(): GameState | null {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY))
  } catch {
    // Storage can be blocked (private browsing, strict settings): play without saving.
    return null
  }
}

export function saveGame(state: GameState) {
  const file: SaveFile = { version: 2, savedAt: Date.now(), state }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(file))
  } catch {
    // Full or blocked storage shouldn't stop the game.
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // Nothing to clear.
  }
}
