import { motion } from 'motion/react'
import type { GameState, PetState } from '../game/state'
import { friendLevel, friendshipOf } from '../game/together'
import { PetSprite } from '../pets/PetSprite'
import { Icon } from './Icon'
import { springs } from './tones'

/** How the pet on stage gets along with each of the others. */
export function FriendsList({ state, pet }: { state: GameState; pet: PetState }) {
  const others = state.pets.filter((p) => p.id !== pet.id)
  if (others.length === 0) return null
  return (
    <div className="mt-4 border-t-2 border-dashed border-cocoa/10 pt-3">
      <h3 className="mb-2 font-body text-sm font-bold text-cocoa-soft">{pet.name}&rsquo;s friends</h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {others.map((other) => {
          const value = Math.round(friendshipOf(state, pet.id, other.id))
          const level = friendLevel(value)
          return (
            <li key={other.id} className="flex items-center gap-2">
              <PetSprite species={other.species} mood={other.sleeping ? 'sleeping' : 'idle'} label="" className="w-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-[0.8125rem] leading-5">
                  <span className="truncate font-bold">{other.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5 text-xs text-berry">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Icon key={i} name="heart" size={12} className={i < level.tier ? '' : 'opacity-25'} />
                    ))}
                    <span className="ml-1 text-cocoa-soft">{level.label}</span>
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label={`Friendship with ${other.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={value}
                  aria-valuetext={`${value} of 100, ${level.label}`}
                  className="h-1.5 overflow-hidden rounded-full bg-blush-soft"
                >
                  <motion.div
                    className="h-full w-full origin-left rounded-full bg-[#e5799a]"
                    initial={false}
                    animate={{ scaleX: value / 100 }}
                    transition={springs.settle}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
