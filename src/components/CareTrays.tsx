import { useState } from 'react'
import { motion } from 'motion/react'
import { FETCH_ENERGY, PLAY_ENERGY } from '../game/logic'
import type { PetState, TogetherGame, ToyId } from '../game/state'
import { friendLevel, friendshipOf, TOGETHER } from '../game/together'
import { useGame } from '../game/GameContext'
import { PetSprite } from '../pets/PetSprite'
import { Icon } from './Icon'
import { springs, toneClasses } from './tones'
import { TrayOption, TrayShell } from './TrayShell'

type PlayTrayProps = { id: string; toys: ToyId[]; onPlay: (toy: 'play' | 'fetch' | ToyId) => void; onClose: () => void }

/** Solo toys for the pet on stage: the two starters, plus any bought in the shop. */
export function PlayTray({ id, toys, onPlay, onClose }: PlayTrayProps) {
  return (
    <TrayShell id={id} title="Playtime!" label="Choose a toy" onClose={onClose}>
      <div className={`grid gap-2 sm:gap-3 ${toys.length ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        <TrayOption
          chip={`${toneClasses.lavender.chip} ${toneClasses.lavender.ink}`}
          icon={<Icon name="yarn" size={26} />}
          title="Yarn"
          lines={['+14 Happiness', `Needs ${PLAY_ENERGY} Energy`]}
          onClick={() => onPlay('play')}
        />
        <TrayOption
          chip={`${toneClasses.mint.chip} ${toneClasses.mint.ink}`}
          icon={<Icon name="ball" size={26} />}
          title="Ball"
          lines={['+18 Happiness', `Needs ${FETCH_ENERGY} Energy`]}
          onClick={() => onPlay('fetch')}
        />
        {toys.includes('feather') && (
          <TrayOption
            chip={`${toneClasses.lavender.chip} ${toneClasses.lavender.ink}`}
            icon={<Icon name="feather" size={26} />}
            title="Feather wand"
            lines={['+16 Happiness', 'Easy on energy']}
            onClick={() => onPlay('feather')}
          />
        )}
        {toys.includes('bubbles') && (
          <TrayOption
            chip={`${toneClasses.mint.chip} ${toneClasses.mint.ink}`}
            icon={<Icon name="bubbles" size={26} />}
            title="Bubble wand"
            lines={['+12 Happiness', '+5 Health']}
            onClick={() => onPlay('bubbles')}
          />
        )}
      </div>
      {toys.length < 2 && <p className="mt-2 px-1 text-xs text-cocoa-soft">More toys are waiting in the Shop.</p>}
    </TrayShell>
  )
}

type TogetherTrayProps = {
  id: string
  lead: PetState
  others: PetState[]
  onGame: (buddyId: string, game: TogetherGame) => void
  onNap: () => void
  onDinner: () => void
  onClose: () => void
}

/** Things the pet on stage can do with the rest of the household. */
export function TogetherTray({ id, lead, others, onGame, onNap, onDinner, onClose }: TogetherTrayProps) {
  const { state } = useGame()
  const awakeOthers = others.filter((p) => !p.sleeping)
  // Pre-pick the closest friend who is awake.
  const [buddyId, setBuddyId] = useState(
    () => [...awakeOthers].sort((a, b) => friendshipOf(state, lead.id, b.id) - friendshipOf(state, lead.id, a.id))[0]?.id ?? others[0]?.id ?? '',
  )
  const buddy = others.find((p) => p.id === buddyId)
  const napCount = (lead.sleeping ? 0 : 1) + awakeOthers.length

  return (
    <TrayShell id={id} title="Together" label="Do something together" onClose={onClose}>
      <h3 className="mb-1.5 px-1 font-body text-sm font-bold text-cocoa-soft">Play with</h3>
      <div role="radiogroup" aria-label="Choose a buddy" className="mb-3 flex flex-wrap gap-2">
        {others.map((p) => {
          const on = p.id === buddyId
          const level = friendLevel(friendshipOf(state, lead.id, p.id))
          return (
            <motion.button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setBuddyId(p.id)}
              whileTap={{ scale: 0.95 }}
              transition={springs.pop}
              className={`flex min-h-12 items-center gap-1.5 rounded-full border-2 py-1 pl-1 pr-3 text-left ${
                on ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream hover:border-cocoa/25'
              }`}
            >
              <PetSprite species={p.species} mood={p.sleeping ? 'sleeping' : 'idle'} label="" className="w-9" />
              <span className="leading-tight">
                <span className="block text-sm font-bold">{p.name}</span>
                <span className="text-[0.6875rem] text-cocoa-soft">{p.sleeping ? 'Sleeping' : level.label}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <TrayOption
          chip={`${toneClasses.mint.chip} ${toneClasses.mint.ink}`}
          icon={<Icon name="ball" size={26} />}
          title="Catch"
          lines={['Both +17 Happiness', `+${TOGETHER.catch.friendship} Friendship`]}
          disabled={!buddy}
          onClick={() => onGame(buddyId, 'catch')}
          ariaLabel={buddy ? `Play catch with ${buddy.name}` : undefined}
        />
        <TrayOption
          chip={`${toneClasses.lavender.chip} ${toneClasses.lavender.ink}`}
          icon={<Icon name="yarn" size={26} />}
          title="Tug-of-war"
          lines={['Both +15 Happiness', `+${TOGETHER.tug.friendship} Friendship`]}
          disabled={!buddy}
          onClick={() => onGame(buddyId, 'tug')}
          ariaLabel={buddy ? `Play tug-of-war with ${buddy.name}` : undefined}
        />
        <TrayOption
          chip={`${toneClasses.lavender.chip} ${toneClasses.lavender.ink}`}
          icon={<Icon name="moon" size={26} />}
          title="Nap together"
          lines={[`${napCount} pets`, 'Pals rest faster']}
          disabled={napCount < 2}
          onClick={onNap}
        />
        <TrayOption
          chip={`${toneClasses.peach.chip} ${toneClasses.peach.ink}`}
          icon={<Icon name="bowl" size={26} />}
          title="Dinner time"
          lines={['Everyone hungry eats', 'Uses the food bag']}
          onClick={onDinner}
        />
      </div>
    </TrayShell>
  )
}
