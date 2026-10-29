import type { ComponentType } from 'react'
import { motion } from 'motion/react'
import type { Accessory, PetMood, Species } from '../game/types'
import { Bunny } from './Bunny'
import { Horse } from './Horse'
import { Kitten } from './Kitten'
import { Puppy } from './Puppy'
import { INK, useBlink, Zzz } from './parts'
import type { RigProps } from './rig'

const RIGS: Record<Species, ComponentType<RigProps>> = {
  puppy: Puppy,
  kitten: Kitten,
  bunny: Bunny,
  horse: Horse,
}

type PetSpriteProps = {
  species: Species
  mood?: PetMood
  accessory?: Accessory | null
  /** Accessible description. Pass an empty string when the pet is decorative. */
  label: string
  className?: string
}

/** Renders any pet in any mood. Sizing comes from className (the SVG is square and scales to its width). */
export function PetSprite({ species, mood = 'idle', accessory = null, label, className }: PetSpriteProps) {
  const Rig = RIGS[species]
  const blink = useBlink(mood !== 'sleeping' && mood !== 'happy' && mood !== 'excited')
  const jumping = mood === 'happy' || mood === 'excited'

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ overflow: 'visible' }}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {/* Ground shadow shrinks as the pet hops up */}
      <motion.ellipse
        cx={100}
        cy={191}
        rx={60}
        ry={7}
        fill={INK}
        opacity={0.1}
        style={{ originX: 0.5, originY: 0.5 }}
        animate={jumping ? { scaleX: [1, mood === 'excited' ? 0.72 : 0.84, 1] } : { scaleX: mood === 'sleeping' ? 1.06 : 1 }}
        transition={jumping ? { duration: mood === 'excited' ? 0.55 : 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      />
      <Rig mood={mood} blink={blink} accessory={accessory} />
      {mood === 'sleeping' && <Zzz at={[150, 50]} />}
    </svg>
  )
}
