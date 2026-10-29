import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameProvider, useGame } from './game/GameContext'
import { createGame, MAX_PETS, newPetId, type GameState } from './game/state'
import { HomeScreen } from './scenes/HomeScreen'
import { SelectScreen } from './scenes/SelectScreen'

/** Screens cross-fade with opacity only: a transform here would break the fixed nav bar. */
function Screen({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  )
}

const scrollTop = () => window.scrollTo(0, 0)

/** The household: home, or the selection screen while adopting another pet. */
function House() {
  const { state, adopt } = useGame()
  const [adopting, setAdopting] = useState(false)
  // True right after an adoption, so home plays the newcomer's welcome.
  const [welcome, setWelcome] = useState(false)

  return (
    <AnimatePresence mode="wait" onExitComplete={scrollTop}>
      {adopting ? (
        <Screen key="adopt" id="adopt">
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
              setAdopting(false)
            }}
          />
        </Screen>
      ) : (
        <Screen key="home" id="home">
          <HomeScreen welcome={welcome} onAdopt={() => setAdopting(true)} />
        </Screen>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  // In memory for now; saving to localStorage comes in step 6.
  const [game, setGame] = useState<GameState | null>(null)

  return (
    <div className="grain">
      <AnimatePresence mode="wait" onExitComplete={scrollTop}>
        {game ? (
          <Screen key="house" id="house">
            <GameProvider initial={game}>
              <House />
            </GameProvider>
          </Screen>
        ) : (
          <Screen key="first" id="first">
            <SelectScreen onAdopt={(pet) => setGame(createGame({ id: newPetId(), ...pet }, Date.now()))} />
          </Screen>
        )}
      </AnimatePresence>
    </div>
  )
}
