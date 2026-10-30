import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Icon } from './Icon'
import { springs } from './tones'

/** Small header button that asks before wiping the save and starting over. */
export function NewGameButton({ petNames, onConfirm }: { petNames: string[]; onConfirm: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New game"
        title="New game"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.92 }}
        transition={springs.pop}
        className="sticker grid size-11 shrink-0 place-items-center text-cocoa-soft hover:text-berry"
      >
        <Icon name="restart" size={20} />
      </motion.button>
      {open && <ConfirmNewGame petNames={petNames} onCancel={() => setOpen(false)} onConfirm={onConfirm} />}
    </>
  )
}

function ConfirmNewGame({ petNames, onCancel, onConfirm }: { petNames: string[]; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  // A modal <dialog> keeps focus inside, makes the page behind it inert, and closes on Escape.
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

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
