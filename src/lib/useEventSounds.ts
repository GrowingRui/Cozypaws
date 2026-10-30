import { useEffect, useRef } from 'react'
import type { GameEvent } from '../game/state'
import { playSfx, unlockAudio, type Sfx } from './sound'

function soundFor(event: GameEvent): Sfx | null {
  if (event.levelUp) return 'levelUp'
  switch (event.kind) {
    case 'feed':
      return 'munch'
    case 'dinner':
      return 'munch'
    case 'pet':
    case 'switch':
      return 'boop'
    case 'play':
    case 'fetch':
    case 'together':
      return 'boing'
    case 'feather':
      return 'swish'
    case 'bubbles':
      return 'pops'
    case 'sleep':
    case 'napTogether':
      return 'lullaby'
    case 'wake':
      return 'wake'
    case 'buy':
      return 'coin'
    case 'equip':
      return 'sparkle'
    case 'adopt':
    case 'walk':
      return 'fanfare'
    case 'refuse':
      return 'nope'
    // The study screen rings its own bell, with a notification alongside.
    case 'study':
      return null
  }
}

/** Plays a sound for each new game event, on whichever screen it happens. */
export function useEventSounds(event: GameEvent | null) {
  // Events from before this mounted (say, from the save) stay quiet.
  const seen = useRef(event?.id ?? 0)

  useEffect(() => {
    if (!event || event.id <= seen.current) return
    seen.current = event.id
    const sfx = soundFor(event)
    if (sfx) playSfx(sfx)
  }, [event])

  // Browsers keep audio off until the first tap; start it then so later sounds (a pet waking up) can play.
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
}
