import { useSyncExternalStore } from 'react'
import type { WalkEventKind } from '../game/state'

/**
 * Small synthesized sound effects. Everything is made with Web Audio, so there are no files to load.
 * Sounds are soft and short on purpose: they confirm an action, they don't announce it.
 */

export type Sfx =
  | 'boop'
  | 'munch'
  | 'boing'
  | 'swish'
  | 'pops'
  | 'lullaby'
  | 'wake'
  | 'coin'
  | 'sparkle'
  | 'fanfare'
  | 'levelUp'
  | 'nope'
  | 'splash'
  | 'chime'

const PREF_KEY = 'cozypaws:sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null

function readOn() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

let on = readOn()
const listeners = new Set<() => void>()

export function setSoundOn(next: boolean) {
  on = next
  try {
    localStorage.setItem(PREF_KEY, next ? 'on' : 'off')
  } catch {
    // The choice still holds for this visit.
  }
  listeners.forEach((l) => l())
  if (next) unlockAudio()
}

/** The sound setting, kept in step across components (and tabs). */
export function useSoundOn() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      const onStorage = (e: StorageEvent) => {
        if (e.key !== PREF_KEY) return
        on = readOn()
        cb()
      }
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(cb)
        window.removeEventListener('storage', onStorage)
      }
    },
    () => on,
  )
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  try {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.55
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return { ctx, out: master! }
  } catch {
    return null
  }
}

/** Browsers only start audio from a tap or key press. Call this during one. */
export function unlockAudio() {
  audio()
}

type Note = { freq: number; at?: number; dur?: number; type?: OscillatorType; vol?: number; to?: number }

function tone({ ctx, out }: { ctx: AudioContext; out: GainNode }, { freq, at = 0, dur = 0.18, type = 'sine', vol = 0.2, to }: Note) {
  const start = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur * 0.8)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(out)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

let noiseBuffer: AudioBuffer | null = null

/** A burst of filtered noise: crunches, swishes and splashes. */
function noise(
  { ctx, out }: { ctx: AudioContext; out: GainNode },
  { at = 0, dur = 0.08, freq = 1800, to, q = 1.2, vol = 0.25 }: { at?: number; dur?: number; freq?: number; to?: number; q?: number; vol?: number },
) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const start = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(freq, start)
  if (to) filter.frequency.exponentialRampToValueAtTime(to, start + dur)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(filter).connect(gain).connect(out)
  src.start(start, Math.random() * 0.5)
  src.stop(start + dur + 0.05)
}

// Notes (Hz), C major around the fifth octave: bright but not shrill.
const C5 = 523.25, E5 = 659.25, G5 = 783.99, B5 = 987.77, C6 = 1046.5, E6 = 1318.5, G6 = 1568

const SOUNDS: Record<Sfx, (a: { ctx: AudioContext; out: GainNode }) => void> = {
  boop: (a) => tone(a, { freq: 520, to: 760, dur: 0.16, type: 'triangle', vol: 0.18 }),
  munch: (a) => {
    for (const [i, f] of [1400, 1100, 1300].entries()) noise(a, { at: i * 0.13, dur: 0.07, freq: f, q: 0.9, vol: 0.32 })
  },
  boing: (a) => tone(a, { freq: 260, to: 820, dur: 0.28, type: 'sine', vol: 0.22 }),
  swish: (a) => noise(a, { dur: 0.32, freq: 900, to: 4200, q: 2, vol: 0.18 }),
  pops: (a) => {
    for (let i = 0; i < 4; i++) tone(a, { freq: 700 + Math.random() * 700, to: 1800, at: i * 0.09 + Math.random() * 0.03, dur: 0.06, vol: 0.16 })
  },
  lullaby: (a) => {
    for (const [i, f] of [G5, E5, C5].entries()) tone(a, { freq: f, at: i * 0.22, dur: 0.5, vol: 0.13 })
  },
  wake: (a) => {
    for (const [i, f] of [C5, E5, G5].entries()) tone(a, { freq: f, at: i * 0.1, dur: 0.3, type: 'triangle', vol: 0.14 })
  },
  coin: (a) => {
    tone(a, { freq: B5, dur: 0.08, type: 'square', vol: 0.06 })
    tone(a, { freq: E6, at: 0.07, dur: 0.3, type: 'square', vol: 0.06 })
  },
  sparkle: (a) => {
    for (const [i, f] of [E6, G6, C6 * 2].entries()) tone(a, { freq: f, at: i * 0.06, dur: 0.22, vol: 0.08 })
  },
  fanfare: (a) => {
    for (const [i, f] of [C5, E5, G5, C6].entries()) tone(a, { freq: f, at: i * 0.11, dur: i === 3 ? 0.6 : 0.2, type: 'triangle', vol: 0.15 })
  },
  levelUp: (a) => {
    for (const [i, f] of [C5, E5, G5, C6, E6].entries()) tone(a, { freq: f, at: i * 0.08, dur: i === 4 ? 0.7 : 0.18, type: 'triangle', vol: 0.15 })
    tone(a, { freq: G6, at: 0.42, dur: 0.6, vol: 0.06 })
  },
  nope: (a) => {
    tone(a, { freq: 330, dur: 0.14, type: 'triangle', vol: 0.15 })
    tone(a, { freq: 262, at: 0.14, dur: 0.22, type: 'triangle', vol: 0.15 })
  },
  splash: (a) => {
    noise(a, { dur: 0.35, freq: 2400, to: 600, q: 0.7, vol: 0.28 })
    tone(a, { freq: 300, to: 140, dur: 0.2, vol: 0.12 })
  },
  chime: (a) => {
    tone(a, { freq: E5, dur: 1.4, vol: 0.18 })
    tone(a, { freq: B5, at: 0.22, dur: 1.4, vol: 0.18 })
  },
}

// Two sounds asked for in the same moment (say, a bite and a level up) would muddle; the first wins.
let lastAt = 0

export function playSfx(name: Sfx) {
  if (!on) return
  const now = performance.now()
  if (now - lastAt < 60) return
  lastAt = now
  const a = audio()
  if (!a) return
  try {
    SOUNDS[name](a)
  } catch {
    // Audio can fail on odd devices; the game carries on silently.
  }
}

/** Which sound each pickup on a walk makes. */
export const WALK_SFX: Record<WalkEventKind, Sfx> = {
  acorn: 'coin',
  snack: 'munch',
  friend: 'boing',
  butterfly: 'sparkle',
  bench: 'lullaby',
  flowers: 'sparkle',
  puddle: 'splash',
}
