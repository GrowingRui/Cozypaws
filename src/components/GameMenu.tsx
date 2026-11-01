import { useState } from 'react'
import { motion } from 'motion/react'
import { useGame } from '../game/GameContext'
import type { GameState } from '../game/state'
import { playSfx, setSoundOn, useSoundOn } from '../lib/sound'
import { Icon } from './Icon'
import { SaveCodeDialog, useModal } from './SaveCodeDialog'
import { springs } from './tones'

type GameMenuProps = {
  onNewGame: () => void
  /** Replace the household with one from a save code. */
  onLoadSave: (state: GameState) => void
}

/** Header button for settings: sound effects, moving the save, and starting a new game (which asks first). */
export function GameMenu({ onNewGame, onLoadSave }: GameMenuProps) {
  const { state } = useGame()
  const petNames = state.pets.map((p) => p.name)
  const [open, setOpen] = useState<'menu' | 'move' | 'confirm' | null>(null)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen('menu')}
        aria-label="Settings"
        title="Settings"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.92 }}
        transition={springs.pop}
        className="sticker grid size-11 shrink-0 place-items-center text-cocoa-soft hover:text-berry"
      >
        <Icon name="sliders" size={20} />
      </motion.button>
      {open === 'menu' && (
        <SettingsDialog onClose={() => setOpen(null)} onMove={() => setOpen('move')} onNewGame={() => setOpen('confirm')} />
      )}
      {open === 'move' && <SaveCodeDialog state={state} onLoad={onLoadSave} onClose={() => setOpen(null)} />}
      {open === 'confirm' && <ConfirmNewGame petNames={petNames} onCancel={() => setOpen(null)} onConfirm={onNewGame} />}
    </>
  )
}

function SettingsDialog({ onClose, onMove, onNewGame }: { onClose: () => void; onMove: () => void; onNewGame: () => void }) {
  const ref = useModal(onClose)
  const soundOn = useSoundOn()

  return (
    <dialog
      ref={ref}
      aria-labelledby="settings-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(92vw,22rem)] overflow-visible bg-transparent p-0 text-cocoa backdrop:bg-cocoa/30"
    >
      <motion.div
        className="sticker stitch flex flex-col gap-4 p-5 shadow-[var(--shadow-float)]"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.pop}
      >
        <h2 id="settings-title" className="text-center text-xl">
          Settings
        </h2>

        <button
          type="button"
          role="switch"
          aria-checked={soundOn}
          onClick={() => {
            setSoundOn(!soundOn)
            // A small boop confirms that sound is back.
            if (!soundOn) playSfx('boop')
          }}
          className="group flex min-h-14 items-center gap-3 rounded-[var(--radius-chip)] bg-cream px-3 text-left hover:bg-blush-soft active:scale-[0.98]"
          style={{ transition: 'transform 160ms var(--ease-spring)' }}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender-soft text-[#6a55a8]">
            <Icon name={soundOn ? 'sound' : 'soundOff'} size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-6">Sound effects</span>
            <span className="block text-sm leading-5 text-cocoa-soft">{soundOn ? 'On' : 'Off'}</span>
          </span>
          {/* The switch itself: a pill with a sliding knob. */}
          <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full ${soundOn ? 'bg-berry' : 'bg-cocoa/20'}`}>
            <motion.span
              className="absolute left-1 top-1 size-5 rounded-full bg-milk shadow-[var(--shadow-base)]"
              animate={{ x: soundOn ? 20 : 0 }}
              transition={springs.pop}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={onMove}
          className="flex min-h-14 items-center gap-3 rounded-[var(--radius-chip)] bg-cream px-3 text-left hover:bg-blush-soft active:scale-[0.98]"
          style={{ transition: 'transform 160ms var(--ease-spring)' }}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint-soft text-[#2f7a57]">
            <Icon name="suitcase" size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-6">Move your pets</span>
            <span className="block text-sm leading-5 text-cocoa-soft">Play on a new link or another device</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onNewGame}
          className="flex min-h-14 items-center gap-3 rounded-[var(--radius-chip)] bg-cream px-3 text-left hover:bg-blush-soft active:scale-[0.98]"
          style={{ transition: 'transform 160ms var(--ease-spring)' }}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-soft text-berry">
            <Icon name="restart" size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-6">New game</span>
            <span className="block text-sm leading-5 text-cocoa-soft">Start over with a new pet</span>
          </span>
        </button>

        <motion.button
          type="button"
          autoFocus
          onClick={onClose}
          whileTap={{ scale: 0.95 }}
          transition={springs.pop}
          className="min-h-12 rounded-full bg-berry px-5 font-bold text-milk shadow-[0_2px_0_var(--color-berry-deep)] hover:bg-berry-deep"
        >
          Done
        </motion.button>
      </motion.div>
    </dialog>
  )
}


function ConfirmNewGame({ petNames, onCancel, onConfirm }: { petNames: string[]; onCancel: () => void; onConfirm: () => void }) {
  const ref = useModal(onCancel)

  const who = petNames.length === 1 ? petNames[0] : petNames.length === 2 ? `${petNames[0]} and ${petNames[1]}` : 'all your pets'

  return (
    <dialog
      ref={ref}
      aria-labelledby="new-game-title"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      className="m-auto max-w-[min(92vw,24rem)] overflow-visible bg-transparent p-0 text-cocoa backdrop:bg-cocoa/30"
    >
      <motion.div
        className="sticker stitch flex flex-col gap-4 p-5 text-center shadow-[var(--shadow-float)]"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.pop}
      >
        <h2 id="new-game-title" className="text-xl">Start a new game?</h2>
        <p className="leading-[1.7] text-cocoa-soft">
          This says goodbye to {who}, your coins and everything in your bag. It can't be undone.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <motion.button
            type="button"
            autoFocus
            onClick={onCancel}
            whileTap={{ scale: 0.95 }}
            transition={springs.pop}
            className="min-h-12 rounded-full bg-cream px-5 font-bold shadow-[var(--shadow-base)] hover:bg-blush-soft"
          >
            Keep playing
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            whileTap={{ scale: 0.95 }}
            transition={springs.pop}
            className="min-h-12 rounded-full bg-berry px-5 font-bold text-milk shadow-[0_2px_0_var(--color-berry-deep)] hover:bg-berry-deep"
          >
            Start over
          </motion.button>
        </div>
      </motion.div>
    </dialog>
  )
}
