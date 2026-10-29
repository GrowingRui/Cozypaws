import type { Tone } from '../components/tones'
import type { Species } from './types'

export type SpeciesInfo = {
  id: Species
  kind: string
  defaultName: string
  tagline: string
  traits: [string, string, string]
  description: string
  tone: Tone
  /** Backdrop wash used behind the pet on the selection stage. */
  backdrop: string
  names: string[]
  /** Lines shown in a speech bubble when the pet is selected or tapped. */
  greetings: string[]
}

export const SPECIES: Record<Species, SpeciesInfo> = {
  puppy: {
    id: 'puppy',
    kind: 'Puppy',
    defaultName: 'Biscuit',
    tagline: 'Thinks every day is the best day ever.',
    traits: ['Bouncy', 'Loyal', 'Snack-motivated'],
    description:
      'Greets you like you have been gone for years, even after five minutes. Lives for fetch, belly rubs and anything that crinkles.',
    tone: 'peach',
    backdrop: 'radial-gradient(70% 60% at 50% 70%, #ffe6d4 0%, #ffd6ba 55%, #ffcfae 100%)',
    names: ['Biscuit', 'Waffles', 'Pudding', 'Bean', 'Toffee'],
    greetings: ['Woof! Pick me!', 'Do you have snacks?', 'Best. Day. Ever!'],
  },
  kitten: {
    id: 'kitten',
    kind: 'Kitten',
    defaultName: 'Mochi',
    tagline: 'Curious about everything, impressed by nothing.',
    traits: ['Curious', 'Independent', 'Nap expert'],
    description:
      'Inspects every box, sunbeam and rustle in the house. Earn a slow blink and you have a friend for life.',
    tone: 'lavender',
    backdrop: 'radial-gradient(70% 60% at 50% 70%, #f1ecfb 0%, #e3dbf6 55%, #d5c9f1 100%)',
    names: ['Mochi', 'Miso', 'Tofu', 'Yuzu', 'Sesame'],
    greetings: ['Mrrp?', 'You may pet me. Once.', 'Is that a box?'],
  },
  bunny: {
    id: 'bunny',
    kind: 'Bunny',
    defaultName: 'Clover',
    tagline: 'Shy at first, then your little shadow.',
    traits: ['Gentle', 'Shy', 'Veggie lover'],
    description:
      'Takes a moment to warm up, then follows you from room to room. Happiest with a crunchy carrot and a quiet corner.',
    tone: 'mint',
    backdrop: 'radial-gradient(70% 60% at 50% 70%, #ecf8f1 0%, #d6efe1 55%, #c3e7d3 100%)',
    names: ['Clover', 'Daisy', 'Bun', 'Pebble', 'Sprout'],
    greetings: ['...hi.', 'Do you like carrots too?', '*nose wiggle*'],
  },
  horse: {
    id: 'horse',
    kind: 'Horse',
    defaultName: 'Maple',
    tagline: 'Calm, steady and always up for an adventure.',
    traits: ['Calm', 'Adventurous', 'Loves long walks'],
    description:
      'Patient, steady and happiest out exploring. Long walks and crisp apples are the way to this heart.',
    tone: 'blush',
    backdrop: 'radial-gradient(70% 60% at 50% 70%, #fdeef2 0%, #fad8e0 55%, #f6c4d0 100%)',
    names: ['Maple', 'Hazel', 'Caramel', 'Juniper', 'Pip'],
    greetings: ['Neigh! Adventure?', 'Got any apples?', 'Shall we go for a walk?'],
  },
}

export const SPECIES_ORDER: Species[] = ['puppy', 'kitten', 'bunny', 'horse']

export const NAME_MAX = 14
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u

/** Returns an error message for an invalid pet name, or null when it is fine. */
export function validateName(raw: string): string | null {
  const name = raw.trim()
  if (name.length === 0) return 'Give your pet a name to continue.'
  if (name.length > NAME_MAX) return `Names can be up to ${NAME_MAX} characters.`
  if (!NAME_PATTERN.test(name)) return 'Use letters, numbers, spaces, hyphens or apostrophes.'
  return null
}
