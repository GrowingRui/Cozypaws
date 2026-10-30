import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { goalDone, type DailyGoals } from '../game/daily'
import { goalLabel } from './DailyGoals'
import { Icon } from './Icon'
import { springs } from './tones'

const SHOW_MS = 3200

/** A short note at the top of any screen when one of today's goals is finished. */
export function GoalToast({ daily, petCount, onHome }: { daily: DailyGoals; petCount: number; onHome: boolean }) {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  // Goals already finished when this mounted (or when the day changed) stay quiet.
  const seen = useRef({ day: daily.day, done: daily.goals.filter(goalDone).map((g) => g.kind) })

  useEffect(() => {
    if (seen.current.day !== daily.day) {
      seen.current = { day: daily.day, done: daily.goals.filter(goalDone).map((g) => g.kind) }
      return
    }
    const fresh = daily.goals.find((g) => goalDone(g) && !seen.current.done.includes(g.kind))
    if (!fresh) return
    seen.current.done.push(fresh.kind)
    setToast({ id: Date.now(), text: goalLabel(fresh, petCount) })
  }, [daily, petCount])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), SHOW_MS)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="sticker flex max-w-sm items-center gap-3 px-4 py-2 shadow-[var(--shadow-float)]"
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springs.pop}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint-soft text-[#2f7a57]">
              <Icon name="check" size={16} />
            </span>
            <span className="min-w-0 text-sm leading-5">
              <span className="block font-bold">Goal done: {toast.text}</span>
              <span className="block text-cocoa-soft">{onHome ? 'Claim your coins in Today’s goals.' : 'Claim your coins on Home.'}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
