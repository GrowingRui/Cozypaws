import { motion } from 'motion/react'
import { SPECIES } from '../game/pets'
import type { PetState } from '../game/state'
import { PetSprite } from '../pets/PetSprite'
import { springs, toneClasses } from './tones'

type PetSwitcherProps = {
  pets: PetState[]
  activeId: string
  onSwitch: (id: string) => void
  onAdopt: () => void
  canAdopt: boolean
}

/** Avatar row for choosing which pet to play with, plus a button to adopt another. */
export function PetSwitcher({ pets, activeId, onSwitch, onAdopt, canAdopt }: PetSwitcherProps) {
  return (
    <nav aria-label="Your pets" className="flex items-center gap-2">
      {pets.map((pet) => {
        const active = pet.id === activeId
        const t = toneClasses[SPECIES[pet.species].tone]
        return (
          <motion.button
            key={pet.id}
            type="button"
            aria-pressed={active}
            aria-label={active ? `${pet.name}, playing now` : `Play with ${pet.name}`}
            title={pet.name}
            onClick={() => onSwitch(pet.id)}
            whileHover={active ? undefined : { y: -3 }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: active ? -2 : 0 }}
            transition={springs.pop}
            className="sticker relative grid size-12 shrink-0 place-items-center overflow-hidden"
          >
            {active && <motion.span layoutId="switcher-pill" className={`absolute inset-0 ${t.chip}`} transition={springs.settle} />}
            <PetSprite species={pet.species} mood={pet.sleeping ? 'sleeping' : 'idle'} accessory={pet.accessory} label="" className="relative w-11 translate-y-1" />
            {active && <span className="absolute inset-0 rounded-[var(--radius-sticker)] ring-2 ring-berry/70 ring-inset" />}
          </motion.button>
        )
      })}
      {canAdopt && (
        <motion.button
          type="button"
          aria-label="Adopt another pet"
          title="Adopt another pet"
          onClick={onAdopt}
          whileHover={{ y: -3, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.pop}
          className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sticker)] border-2 border-dashed border-cocoa/25 text-cocoa-soft hover:border-berry/60 hover:text-berry"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </motion.button>
      )}
    </nav>
  )
}
