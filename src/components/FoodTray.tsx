import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { FOOD_ORDER, FOODS, type FoodId } from '../game/items'
import type { StatKey } from '../game/state'
import { Icon } from './Icon'
import { springs, toneClasses } from './tones'

export const STAT_LABEL: Record<StatKey, string> = {
  fullness: 'Tummy',
  happiness: 'Happiness',
  energy: 'Energy',
  health: 'Health',
  bond: 'Bond',
}

type FoodTrayProps = {
  id: string
  inventory: Record<FoodId, number>
  onPick: (food: FoodId) => void
  onClose: () => void
}

/** Food picker that opens from the Feed button. Stays open so you can feed again quickly. */
export function FoodTray({ id, inventory, onPick, onClose }: FoodTrayProps) {
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      id={id}
      role="group"
      aria-label="Choose a food"
      className="sticker stitch p-3 sm:p-4"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={springs.settle}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base">What&rsquo;s for lunch?</h2>
        <button
          type="button"
          onClick={onClose}
          className="-my-2 -mr-2 min-h-11 rounded-full px-4 text-sm font-bold text-cocoa-soft hover:bg-cocoa/5 active:scale-95"
        >
          Close
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {FOOD_ORDER.map((foodId, i) => {
          const food = FOODS[foodId]
          const count = inventory[foodId]
          const t = toneClasses[food.tone]
          const summary = Object.entries(food.effect)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([k, v]) => `+${v} ${STAT_LABEL[k as StatKey]}`)
          return (
            <motion.button
              key={foodId}
              ref={i === 0 ? firstRef : undefined}
              type="button"
              disabled={count <= 0}
              onClick={() => onPick(foodId)}
              aria-label={`Feed ${food.name}, ${count} left. ${summary.join(', ')}`}
              whileHover={count > 0 ? { y: -3 } : undefined}
              whileTap={count > 0 ? { scale: 0.94 } : undefined}
              transition={springs.pop}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-chip)] bg-cream px-1 py-2 text-center shadow-[var(--shadow-base)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={`relative grid size-11 place-items-center rounded-full ${t.chip} ${t.ink}`}>
                <Icon name={food.icon} size={26} />
                <span className="absolute -right-2 -top-1 min-w-5 rounded-full bg-cocoa px-1 text-[0.6875rem] font-bold leading-5 text-milk">
                  {count}
                </span>
              </span>
              <span className="text-[0.8125rem] font-bold leading-tight">{food.name}</span>
              <span className="flex flex-col text-[0.6875rem] leading-tight text-cocoa-soft">
                {count > 0 ? summary.map((line) => <span key={line}>{line}</span>) : 'None left'}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
