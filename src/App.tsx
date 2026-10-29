import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CoinChip } from './components/CoinChip'
import { Icon } from './components/Icon'
import { NavBar, type Tab } from './components/NavBar'
import { GameProvider, useGame } from './game/GameContext'
import { createGame, MAX_PETS, newPetId, type GameState } from './game/state'
import { HomeScreen } from './scenes/HomeScreen'
import { SelectScreen } from './scenes/SelectScreen'
import { WalkScreen } from './scenes/WalkScreen'

/** Screens cross-fade with opacity only: a transform here would break the fixed nav bar. */
function Screen({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  )
}

const scrollTop = () => window.scrollTo(0, 0)

/** Placeholder for tabs that arrive in a later update. */
function ComingSoon({ title, text }: { title: string; text: string }) {
  const { state } = useGame()
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        <CoinChip coins={state.coins} />
      </header>
      <div className="sticker stitch mx-auto mt-8 flex max-w-md flex-col items-center gap-2 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-peach-soft text-[#b5602b]">
          <Icon name="shop" size={30} />
        </span>
        <h2 className="text-xl">Opening soon</h2>
        <p className="text-cocoa-soft">{text}</p>
      </div>
    </div>
  )
}

/** The household: tabs, plus the selection screen while adopting another pet. */
function House() {
  const { state, adopt } = useGame()
  const [tab, setTab] = useState<Tab>('home')
  const [adopting, setAdopting] = useState(false)
  // True right after an adoption, so home plays the newcomer's welcome.
  const [welcome, setWelcome] = useState(false)
  const onWalk = !!state.walk

  // A walk in progress always owns the screen.
  useEffect(() => {
    if (onWalk) setTab('walk')
  }, [onWalk])

  const view = adopting ? 'adopt' : tab
  const changeTab = (next: Tab) => {
    setWelcome(false)
    setTab(next)
  }

  return (
    <>
      <AnimatePresence mode="wait" onExitComplete={scrollTop}>
        <Screen key={view}>
          {view === 'adopt' && (
            <SelectScreen
              takenNames={state.pets.map((p) => p.name)}
              spotsLeft={MAX_PETS - state.pets.length}
              onCancel={() => {
                setWelcome(false)
                setAdopting(false)
              }}
              onAdopt={(pet) => {
                adopt({ id: newPetId(), ...pet })
                setWelcome(true)
                setTab('home')
                setAdopting(false)
              }}
            />
          )}
          {view === 'home' && <HomeScreen welcome={welcome} onAdopt={() => setAdopting(true)} />}
          {view === 'walk' && <WalkScreen onDone={() => changeTab('home')} />}
          {view === 'bag' && <ComingSoon title="Bag" text="Your food and toys will live here." />}
          {view === 'shop' && <ComingSoon title="Shop" text="Treats, toys and accessories are on their way." />}
        </Screen>
      </AnimatePresence>

      {/* The nav bar hides during adoption and while out on a walk */}
      <AnimatePresence>
        {!adopting && !onWalk && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <NavBar active={tab} onChange={changeTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  // In memory for now; saving to localStorage comes in step 6.
  const [game, setGame] = useState<GameState | null>(null)

  return (
    <div className="grain">
      <AnimatePresence mode="wait" onExitComplete={scrollTop}>
        {game ? (
          <Screen key="house">
            <GameProvider initial={game}>
              <House />
            </GameProvider>
          </Screen>
        ) : (
          <Screen key="first">
            <SelectScreen onAdopt={(pet) => setGame(createGame({ id: newPetId(), ...pet }, Date.now()))} />
          </Screen>
        )}
      </AnimatePresence>
    </div>
  )
}
