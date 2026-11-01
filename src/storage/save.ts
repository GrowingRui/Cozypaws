import { createGame, createPet, type GameState, type PetState } from '../game/state'

/**
 * The household is saved to localStorage after every change, so closing the tab never loses progress.
 * Walks and study sessions are stored with real timestamps, so they pick up where they were on reload
 * (or finish, if their time ran out while the game was closed).
 *
 * localStorage belongs to one web address in one browser. A save code carries the household to
 * another address (a new deploy link) or another device.
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
    // Saves from before daily goals start with none; a fresh set is picked on the next tick.
    daily: isObject(raw.daily) && Array.isArray(raw.daily.goals) ? raw.daily : base.daily,
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

const toFile = (state: GameState) => JSON.stringify({ version: 2, savedAt: Date.now(), state } satisfies SaveFile)

let persistAsked = false

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, toFile(state))
  } catch {
    // Full or blocked storage shouldn't stop the game.
    return
  }
  // Ask once to keep the save when the browser clears space. Browsers may say no; that's fine.
  if (!persistAsked) {
    persistAsked = true
    navigator.storage?.persist?.().catch(() => {})
  }
}

/** True when this browser keeps what the game writes (false in some private modes and in-app browsers). */
export function canSave(): boolean {
  try {
    const probe = `${SAVE_KEY}:probe`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const CODE_PREFIX = 'COZYPAWS-'

/** The household as one line of text, to paste into the game somewhere else. */
export function exportCode(state: GameState): string {
  const bytes = new TextEncoder().encode(toFile(state))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return CODE_PREFIX + btoa(binary)
}

/** Reads a save code back into a household, or null if it isn't one. Spaces and line breaks from chat apps are ignored. */
export function importCode(code: string): GameState | null {
  const body = code.replace(/\s+/g, '')
  if (!body.toUpperCase().startsWith(CODE_PREFIX)) return null
  try {
    const binary = atob(body.slice(CODE_PREFIX.length))
    const text = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
    return parseSave(text)
  } catch {
    return null
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // Nothing to clear.
  }
}
