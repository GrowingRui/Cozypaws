import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { NavBar, type Tab } from './components/NavBar'
import { WelcomeBack } from './components/WelcomeBack'
import { summarizeAway, type AwaySummary } from './game/away'
import { GameProvider, useGame } from './game/GameContext'
import { createGame, MAX_PETS, newPetId, type GameState } from './game/state'
import { HomeScreen } from './scenes/HomeScreen'
import { SelectScreen } from './scenes/SelectScreen'
import { useEventSounds } from './lib/useEventSounds'
import { clearGame, loadGame } from './storage/save'

// Walk and Study load on first visit, keeping the initial download small.
const WalkScreen = lazy(() => import('./scenes/WalkScreen').then((m) => ({ default: m.WalkScreen })))
const StudyScreen = lazy(() => import('./scenes/StudyScreen').then((m) => ({ default: m.StudyScreen })))
const ShopScreen = lazy(() => import('./scenes/ShopScreen').then((m) => ({ default: m.ShopScreen })))

/** Screens cross-fade with opacity only: a transform here would break the fixed nav bar. */
function Screen({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  )
}

const scrollTop = () => window.scrollTo(0, 0)

/** The household: tabs, plus the selection screen while adopting another pet. */
function House({ onNewGame, away }: { onNewGame: () => void; away: AwaySummary | null }) {
  const { state, adopt } = useGame()
  const [showAway, setShowAway] = useState(!!away)
  const [tab, setTab] = useState<Tab>('home')
  const [adopting, setAdopting] = useState(false)
  // True right after an adoption, so home plays the newcomer's welcome.
  const [welcome, setWelcome] = useState(false)
  const onWalk = !!state.walk
  const studying = !!state.study

  // A walk or study session in progress always owns the screen.
  useEffect(() => {
    if (onWalk) setTab('walk')
    else if (studying) setTab('study')
  }, [onWalk, studying])

  useEventSounds(state.event)

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
          {view === 'home' && <HomeScreen welcome={welcome} onAdopt={() => setAdopting(true)} onNewGame={onNewGame} />}
          <Suspense fallback={<div className="min-h-dvh" />}>
            {view === 'walk' && <WalkScreen onDone={() => changeTab('home')} />}
            {view === 'study' && <StudyScreen onDone={() => changeTab('home')} />}
            {view === 'shop' && <ShopScreen />}
          </Suspense>
        </Screen>
      </AnimatePresence>

      {/* The nav bar hides during adoption, walks and study sessions */}
      <AnimatePresence>
        {!adopting && !onWalk && !studying && (
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

      {showAway && away && <WelcomeBack summary={away} pets={state.pets} onClose={() => setShowAway(false)} />}
    </>
  )
}

export default function App() {
  // Pick up the saved household, if there is one. GameProvider saves every change after this.
  const [game, setGame] = useState<GameState | null>(loadGame)
  // Worked out once, from the save as it was before time caught up.
  const [away, setAway] = useState<AwaySummary | null>(() => (game ? summarizeAway(game, Date.now()) : null))
  const newGame = () => {
    clearGame()
    setAway(null)
    setGame(null)
  }

  return (
    <div className="grain">
      <AnimatePresence mode="wait" onExitComplete={scrollTop}>
        {game ? (
          <Screen key="house">
            <GameProvider initial={game} persist onCleared={() => {
                setAway(null)
                setGame(null)
              }}>
              <House onNewGame={newGame} away={away} />
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
