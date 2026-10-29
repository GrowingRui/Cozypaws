import type { TargetAndTransition, Transition } from 'motion/react'
import type { PetMood } from '../game/types'

/**
 * Mood → motion presets shared by every pet rig.
 * Each function returns props to spread onto a motion element: { animate, transition }.
 * Loops use keyframes + repeat; resting poses use a spring so mood changes glide.
 */
export type PartMotion = { animate: TargetAndTransition; transition: Transition }

const loop = (duration: number, extra: Transition = {}): Transition => ({
  duration,
  repeat: Infinity,
  ease: 'easeInOut',
  ...extra,
})
const rest: Transition = { type: 'spring', stiffness: 160, damping: 18 }

export function bodyMotion(mood: PetMood): PartMotion {
  switch (mood) {
    case 'happy':
      return { animate: { y: [0, -10, 0], scaleY: [1, 1.03, 1], scaleX: 1, rotate: 0 }, transition: loop(0.7) }
    case 'excited':
      return { animate: { y: [0, -20, 0], rotate: [0, -5, 5, 0], scaleY: 1, scaleX: 1 }, transition: loop(0.55) }
    case 'eating':
      return { animate: { scaleY: [1, 0.97, 1], y: 0, rotate: 0, scaleX: 1 }, transition: loop(0.45) }
    case 'sleeping':
      return { animate: { scaleY: [0.94, 0.97, 0.94], scaleX: 1.02, y: 6, rotate: 0 }, transition: loop(4.2) }
    case 'walking':
      return { animate: { y: [0, -5, 0], rotate: [-2, 2, -2], scaleY: 1, scaleX: 1 }, transition: loop(0.5) }
    case 'hungry':
      return { animate: { scaleY: [0.98, 1, 0.98], y: 3, rotate: 0, scaleX: 1 }, transition: loop(3.6) }
    case 'tired':
      return { animate: { rotate: [-2, 2, -2], scaleY: [0.96, 0.98, 0.96], y: 3, scaleX: 1 }, transition: loop(4.5) }
    default:
      return { animate: { scaleY: [1, 1.035, 1], scaleX: [1, 0.985, 1], y: 0, rotate: 0 }, transition: loop(3.2) }
  }
}

export function headMotion(mood: PetMood): PartMotion {
  switch (mood) {
    case 'happy':
      return { animate: { rotate: [-5, 5, -5], y: 0 }, transition: loop(1.4) }
    case 'excited':
      return { animate: { rotate: [-7, 7, -7], y: 0 }, transition: loop(0.6) }
    case 'eating':
      return { animate: { y: [0, 7, 0], rotate: 0 }, transition: loop(0.45) }
    case 'sleeping':
      return { animate: { y: 7, rotate: 8 }, transition: rest }
    case 'walking':
      return { animate: { rotate: [-3, 3, -3], y: 0 }, transition: loop(1) }
    case 'hungry':
      return { animate: { y: 4, rotate: -6 }, transition: rest }
    case 'tired':
      return { animate: { y: 6, rotate: [4, 7, 4] }, transition: loop(4) }
    default:
      // Mostly still, with an occasional curious tilt.
      return { animate: { rotate: [0, 0, 5, 5, 0, 0], y: 0 }, transition: loop(7, { times: [0, 0.45, 0.52, 0.7, 0.77, 1] }) }
  }
}

export type TailStyle = 'wag' | 'swish' | 'puff'

export function tailMotion(mood: PetMood, style: TailStyle): PartMotion {
  if (style === 'puff') {
    const fast = mood === 'happy' || mood === 'excited' || mood === 'walking'
    if (mood === 'sleeping') return { animate: { scale: 1 }, transition: rest }
    return { animate: { scale: [1, 1.14, 1] }, transition: loop(fast ? 0.35 : 2.4) }
  }
  const [calm, lively] = style === 'wag' ? [14, 26] : [8, 14]
  switch (mood) {
    case 'happy':
    case 'excited':
      return { animate: { rotate: [-lively, lively, -lively] }, transition: loop(style === 'wag' ? 0.3 : 0.9) }
    case 'walking':
      return { animate: { rotate: [-calm, calm, -calm] }, transition: loop(0.5) }
    case 'sleeping':
      return { animate: { rotate: -6 }, transition: rest }
    case 'hungry':
    case 'tired':
      return { animate: { rotate: [-3, 3, -3] }, transition: loop(3) }
    default:
      return { animate: { rotate: [-calm, calm, -calm] }, transition: loop(style === 'wag' ? 0.9 : 3) }
  }
}

export type EarStyle = 'flop' | 'perk' | 'tall'

/** side: -1 for the left ear, 1 for the right. Positive "out" values swing the ear away from the face. */
export function earMotion(mood: PetMood, style: EarStyle, side: -1 | 1): PartMotion {
  // Hanging ears pivot at the top and upright ears at the base, so "outward" is the opposite rotation.
  const out = (deg: number) => (style === 'flop' ? -side : side) * deg
  const lively = mood === 'happy' || mood === 'excited'

  if (style === 'flop') {
    if (lively) return { animate: { rotate: [0, out(18), 0] }, transition: loop(0.4) }
    if (mood === 'walking') return { animate: { rotate: [0, out(10), 0] }, transition: loop(0.5) }
    if (mood === 'hungry' || mood === 'tired' || mood === 'sleeping') return { animate: { rotate: out(-4) }, transition: rest }
    return { animate: { rotate: [0, out(4), 0] }, transition: loop(2.8) }
  }

  if (style === 'perk') {
    if (lively) return { animate: { rotate: [0, out(8), 0] }, transition: loop(0.5) }
    if (mood === 'walking') return { animate: { rotate: [0, out(6), 0] }, transition: loop(0.5) }
    if (mood === 'sleeping' || mood === 'tired') return { animate: { rotate: out(22) }, transition: rest }
    if (mood === 'hungry') return { animate: { rotate: out(30) }, transition: rest }
    // Occasional twitch; the two ears use different periods so they never sync up.
    return {
      animate: { rotate: [0, 0, out(14), 0, 0] },
      transition: loop(side === -1 ? 5.2 : 6.7, { times: [0, 0.82, 0.86, 0.9, 1] }),
    }
  }

  // Tall bunny ears: sway when content, droop when low.
  if (lively) return { animate: { rotate: [out(-4), out(10), out(-4)] }, transition: loop(0.5) }
  if (mood === 'walking') return { animate: { rotate: [0, out(12), 0] }, transition: loop(0.5) }
  if (mood === 'sleeping') return { animate: { rotate: out(58) }, transition: rest }
  if (mood === 'tired') return { animate: { rotate: out(34) }, transition: rest }
  if (mood === 'hungry') return { animate: { rotate: out(42) }, transition: rest }
  return { animate: { rotate: [out(-2), out(5), out(-2)] }, transition: loop(side === -1 ? 3.4 : 3.9) }
}

/** Paw/leg step. phase 0 and 1 alternate so legs move in turn. */
export function legMotion(mood: PetMood, phase: 0 | 1, kind: 'hop' | 'swing' = 'hop'): PartMotion {
  if (mood === 'walking') {
    return kind === 'swing'
      ? { animate: { rotate: phase ? [12, -12, 12] : [-12, 12, -12], y: 0 }, transition: loop(0.5) }
      : { animate: { y: phase ? [0, -6, 0, 0] : [0, 0, -6, 0], rotate: 0 }, transition: loop(0.5, { ease: 'linear' }) }
  }
  return { animate: { y: 0, rotate: 0 }, transition: rest }
}
