import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { AdoptedPet } from './game/types'
import { HomeScreen } from './scenes/HomeScreen'
import { SelectScreen } from './scenes/SelectScreen'

export default function App() {
  // In-memory for now; saving to localStorage comes with the game state in a later step.
  const [pet, setPet] = useState<AdoptedPet | null>(null)

  return (
    <div className="grain">
      {/* Screens cross-fade with opacity only: a transform here would break the fixed nav bar. */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.div
          key={pet ? 'home' : 'select'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {pet ? <HomeScreen pet={pet} /> : <SelectScreen onAdopt={setPet} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
