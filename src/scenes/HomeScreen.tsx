import { useState } from 'react'
import { ActionButton } from '../components/ActionButton'
import { Icon } from '../components/Icon'
import { NavBar, type Tab } from '../components/NavBar'
import { StatBar } from '../components/StatBar'
import { SPECIES } from '../game/pets'
import type { AdoptedPet } from '../game/types'
import { PetSprite } from '../pets/PetSprite'
import { Stage } from './Stage'

// Stats are still static preview values; the real game state arrives in step 3.
const previewStats = [
  { label: 'Tummy', icon: 'drumstick', tone: 'peach', value: 72 },
  { label: 'Happiness', icon: 'heart', tone: 'blush', value: 88 },
  { label: 'Energy', icon: 'bolt', tone: 'lavender', value: 46 },
  { label: 'Health', icon: 'leaf', tone: 'mint', value: 94 },
  { label: 'Bond', icon: 'sparkle', tone: 'berry', value: 18 },
] as const

export function HomeScreen({ pet }: { pet: AdoptedPet }) {
  const [tab, setTab] = useState<Tab>('home')
  const info = SPECIES[pet.species]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6 lg:pb-32">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="sticker grid size-12 shrink-0 place-items-center overflow-hidden">
            <PetSprite species={pet.species} label="" className="w-11 translate-y-1" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl sm:text-3xl">{pet.name}</h1>
            <p className="text-sm font-bold leading-tight text-cocoa-soft">Level 1 {info.kind.toLowerCase()}</p>
          </div>
        </div>
        <div className="sticker flex items-center gap-1.5 px-3 py-2 font-bold text-[#b5602b]" aria-label="50 coins">
          <Icon name="coin" size={20} />
          <span className="tabular-nums text-cocoa">50</span>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Stage label={`${pet.name}'s room`}>
              <PetSprite species={pet.species} label={`${pet.name} the ${info.kind.toLowerCase()}`} className="w-[min(56vw,16rem)]" />
            </Stage>
            <p className="sticker absolute left-1/2 top-6 w-max max-w-[64%] -translate-x-1/2 px-4 py-2 text-center text-sm font-bold">
              {info.greetings[0]}
            </p>
          </div>
          <div role="group" aria-label="Care actions" className="grid grid-cols-5 gap-2 sm:gap-3">
            <ActionButton icon="bowl" label="Feed" tone="peach" badge={4} />
            <ActionButton icon="hand" label="Pet" tone="blush" />
            <ActionButton icon="yarn" label="Play" tone="lavender" />
            <ActionButton icon="ball" label="Ball" tone="mint" />
            <ActionButton icon="moon" label="Sleep" tone="lavender" />
          </div>
        </div>

        <aside aria-label={`How ${pet.name} is doing`} className="sticker stitch flex flex-col gap-3 p-4 sm:p-6">
          <h2 className="text-lg">How {pet.name} feels</h2>
          {previewStats.map((s) => (
            <StatBar key={s.label} {...s} />
          ))}
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <NavBar active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
