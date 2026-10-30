import { gameReducer, MAX_ELAPSED_MS } from './logic'
import type { GameState, PetState, StatKey } from './state'

/** Shorter breaks than this don't get a welcome back. */
export const AWAY_MIN_MS = 15 * 60 * 1000

/** Below this, a need gets a mention ("getting hungry"). */
const NEEDY = 40

export type PetNews = {
  petId: string
  name: string
  /** Rounded change in each need while away; only needs that moved. */
  changes: Partial<Record<StatKey, number>>
  /** What happened, in one short line. */
  line: string
  /** The need that most wants attention now, if any. */
  need: StatKey | null
}

export type AwaySummary = {
  awayMs: number
  /** True when the time away went past the catch-up cap. */
  capped: boolean
  pets: PetNews[]
  studyFinished: boolean
}

/** One way to say each need per pet slot, so a household of up to four never repeats itself. */
const NEED_WORDS: Partial<Record<StatKey, string[]>> = {
  fullness: ['is getting hungry', 'has a rumbly tummy', 'is hoping for a snack', 'keeps peeking at the food bowl'],
  happiness: ['wants to play', 'is a little bored', 'missed playing with you', 'would love some attention'],
  energy: ['is sleepy', 'keeps yawning', 'could use a nap', 'is ready for a lie-down'],
  health: ['needs some care', 'is feeling a bit off', 'could use some looking after', 'wants a quiet, cosy day'],
}

const capitalize = (text: string) => text[0]!.toUpperCase() + text.slice(1)

function petNews(before: PetState, after: PetState, index: number): PetNews {
  const changes: PetNews['changes'] = {}
  for (const k of ['fullness', 'happiness', 'energy'] as const) {
    const d = Math.round(after.stats[k] - before.stats[k])
    if (d !== 0) changes[k] = d
  }
  // The need that's lowest, if it's low enough to mention.
  const need = (['fullness', 'energy', 'happiness', 'health'] as const)
    .filter((k) => after.stats[k] < NEEDY && !(k === 'energy' && after.sleeping))
    .sort((a, b) => after.stats[a] - after.stats[b])[0] ?? null

  const words = need ? NEED_WORDS[need]! : null
  const needLine = words ? words[index % words.length]! : null
  let line: string
  if (before.sleeping && !after.sleeping) line = needLine ? `Woke up rested, and ${needLine}` : 'Had a long nap and woke up rested'
  else if (after.sleeping) line = 'Is still fast asleep'
  else if (needLine) line = capitalize(needLine)
  else line = 'Kept busy and missed you'

  return { petId: after.id, name: after.name, changes, line, need }
}

/**
 * What happened while the game was closed, worked out by running the same catch-up the game
 * applies on load. Returns null for short breaks.
 */
export function summarizeAway(saved: GameState, now: number): AwaySummary | null {
  const awayMs = now - saved.lastTick
  if (awayMs < AWAY_MIN_MS) return null
  const after = gameReducer(saved, { type: 'tick', now })
  const pets = saved.pets.flatMap((p, i) => {
    const next = after.pets.find((q) => q.id === p.id)
    return next ? [petNews(p, next, i)] : []
  })
  const studyFinished = !!saved.study && saved.study.phase !== 'done' && after.study?.phase === 'done'
  return { awayMs, capped: awayMs > MAX_ELAPSED_MS, pets, studyFinished }
}

/** "3 hours", "45 minutes", "a day". */
export function awayDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} minutes`
  const hours = Math.round(min / 60)
  if (hours < 24) return hours === 1 ? 'an hour' : `${hours} hours`
  const days = Math.round(hours / 24)
  return days === 1 ? 'a day' : `${days} days`
}
