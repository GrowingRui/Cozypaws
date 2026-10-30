import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { awayDuration, type AwaySummary } from '../game/away'
import { STAT_KEYS, type PetState } from '../game/state'
import { playSfx } from '../lib/sound'
import { PetSprite } from '../pets/PetSprite'
import { STAT_LABEL } from './FoodTray'
import { springs } from './tones'

type WelcomeBackProps = {
  summary: AwaySummary
  /** The household now, for drawing each pet as it is (asleep, dressed up). */
  pets: PetState[]
  onClose: () => void
}

/** Shown when the game opens after a break: how long it's been and how each pet is doing. */
export function WelcomeBack({ summary, pets, onClose }: WelcomeBackProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  const close = () => {
    playSfx('wake')
    onClose()
  }
  const shown = summary.pets.flatMap((news) => {
    const pet = pets.find((p) => p.id === news.petId)
    return pet ? [{ news, pet }] : []
  })

  return (
    <dialog
      ref={ref}
      aria-labelledby="welcome-back-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-auto max-h-[92dvh] w-[min(92vw,26rem)] overflow-visible bg-transparent p-0 pt-12 text-cocoa backdrop:bg-cocoa/30"
    >
      <motion.div
        className="sticker stitch flex flex-col gap-4 px-5 pb-5 pt-12 shadow-[var(--shadow-float)]"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.pop}
      >
        {/* Everyone pops up over the top edge to say hi, one after another. */}
        <div className="absolute inset-x-0 -top-12 flex justify-center gap-1" aria-hidden="true">
          {shown.map(({ pet }, i) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.pop, delay: 0.15 + i * 0.12 }}
            >
              <PetSprite species={pet.species} mood={pet.sleeping ? 'sleeping' : 'happy'} accessory={pet.accessory} label="" className="w-20" />
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <h2 id="welcome-back-title" className="text-2xl">
            Welcome back!
          </h2>
          <p className="text-cocoa-soft">
            You were away for {awayDuration(summary.awayMs)}.{summary.capped && ' Everyone took it easy while you were gone.'}
          </p>
        </div>

        <ul className="flex max-h-[45dvh] flex-col gap-2 overflow-y-auto">
          {shown.map(({ news, pet }) => (
            <li key={pet.id} className="flex items-center gap-3 rounded-[var(--radius-chip)] bg-cream px-3 py-2">
              <div className="min-w-0">
                <p className="font-bold leading-6">{pet.name}</p>
                <p className="text-sm leading-5 text-cocoa-soft">{news.line}</p>
                {STAT_KEYS.some((k) => news.changes[k]) && (
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs font-bold">
                    {STAT_KEYS.filter((k) => news.changes[k]).map((k) => (
                      <span key={k} className={news.changes[k]! > 0 ? 'text-[#2f7a57]' : 'text-berry'}>
                        {news.changes[k]! > 0 ? '+' : ''}
                        {news.changes[k]} {STAT_LABEL[k]}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {summary.studyFinished && <p className="text-center text-sm text-cocoa-soft">Your study session finished while you were away.</p>}

        <motion.button
          type="button"
          autoFocus
          onClick={close}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={springs.pop}
          className="min-h-12 rounded-full bg-berry px-5 font-bold text-milk shadow-[0_2px_0_var(--color-berry-deep)] hover:bg-berry-deep"
        >
          {shown.length === 1 ? `Say hi to ${shown[0]!.pet.name}` : 'Say hi to everyone'}
        </motion.button>
      </motion.div>
    </dialog>
  )
}
