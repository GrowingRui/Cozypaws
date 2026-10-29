import { motion } from 'motion/react'
import { Icon } from '../components/Icon'
import type { FoodId } from '../game/items'
import { INK } from '../pets/parts'

/**
 * One-shot props that appear during care reactions. Each is positioned relative to the pet box
 * and is mounted with the event id as its key, so the animation replays on every repeat.
 */

const stroke = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

export function FoodProp({ food }: { food: FoodId }) {
  return (
    <motion.div
      className="pointer-events-none absolute -right-[18%] bottom-[2%] z-10 w-[34%] max-w-24"
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.08, 1, 0.9], y: [10, 0, 0, 4] }}
      transition={{ duration: 2.3, times: [0, 0.12, 0.85, 1] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 70" className="w-full overflow-visible">
        {/* Food shrinks away as it is eaten */}
        <motion.g
          style={{ originX: 0.5, originY: 1 }}
          initial={{ scaleY: 1, scaleX: 1 }}
          animate={{ scaleY: [1, 1, 0.15], scaleX: [1, 1, 0.7] }}
          transition={{ duration: 1.9, times: [0, 0.2, 1], ease: 'easeIn' }}
        >
          {food === 'kibble' && (
            <g>
              {[
                [30, 38],
                [42, 32],
                [55, 34],
                [67, 38],
                [48, 40],
                [36, 44],
                [60, 44],
              ].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx={7} ry={5.5} fill={i % 2 ? '#d99e6a' : '#c98a55'} {...stroke} strokeWidth={2} />
              ))}
            </g>
          )}
          {food === 'cookie' && (
            <path
              d="M50 12l7 13 14.5 2-10.5 10 2.5 14.5L50 44.5 36.5 51.5 39 37 28.5 27l14.5-2Z"
              fill="#f7cf8a"
              {...stroke}
            />
          )}
          {food === 'veggies' && (
            <g>
              <path d="M30 42c-4-10 2-20 10-18 2-8 14-9 16-1 8-4 16 4 12 13Z" fill="#9fd8bb" {...stroke} strokeWidth={2.5} />
              <path d="M56 40 72 18" stroke="#f0a35e" strokeWidth={8} strokeLinecap="round" />
              <path d="M56 40 72 18" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.35} />
              <path d="M72 18c2-5 6-7 9-6M72 18c4-1 8 0 10 3" fill="none" stroke="#7fbf9b" strokeWidth={3} strokeLinecap="round" />
            </g>
          )}
        </motion.g>
        {food === 'cookie' ? (
          <ellipse cx={50} cy={56} rx={40} ry={9} fill="#fffdf9" {...stroke} />
        ) : (
          <path d="M8 40h84a42 26 0 0 1-84 0Z" fill={food === 'veggies' ? '#cfc3f0' : '#f6b8c6'} {...stroke} />
        )}
      </svg>
    </motion.div>
  )
}

export function YarnProp() {
  return (
    <motion.div
      className="pointer-events-none absolute -left-[22%] bottom-[2%] z-10 w-[24%] max-w-16"
      initial={{ x: -140, opacity: 0, rotate: 0 }}
      animate={{ x: [-140, 0, 10, 0], y: [0, 0, -24, 0], opacity: [0, 1, 1, 1, 0], rotate: [0, 540, 600, 620] }}
      transition={{ duration: 2.1, times: [0, 0.45, 0.6, 0.75], opacity: { duration: 2.1, times: [0, 0.1, 0.5, 0.85, 1] } }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 60 60" className="w-full overflow-visible">
        <path d="M44 48c8 4 12 8 14 12" fill="none" stroke="#a796d8" strokeWidth={3} strokeLinecap="round" />
        <circle cx={30} cy={30} r={22} fill="#cfc3f0" {...stroke} />
        <path d="M12 22c10 0 26 8 34 22M10 34c8 0 18 6 22 16M22 9c4 7 18 11 28 9" fill="none" stroke="#a796d8" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

export function BallProp() {
  return (
    <motion.div
      className="pointer-events-none absolute right-[8%] top-[38%] z-10 w-[18%] max-w-12"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{ x: [0, 90, 220, 90, 0], y: [0, -120, -20, -110, 10], opacity: [0, 1, 1, 1, 1, 0], rotate: [0, 360, 720, 1080, 1260] }}
      transition={{ duration: 1.8, ease: 'easeInOut', opacity: { duration: 1.8, times: [0, 0.05, 0.4, 0.6, 0.9, 1] } }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="w-full overflow-visible">
        <circle cx={20} cy={20} r={16} fill="#bfe6d1" {...stroke} />
        <path d="M6 14c8 4 20 4 28 0M6 26c8-4 20-4 28 0" fill="none" stroke="#f39bb0" strokeWidth={3.5} strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

export function PatProp() {
  return (
    <motion.div
      className="pointer-events-none absolute -top-[6%] left-1/2 z-10 -translate-x-1/2 text-berry"
      initial={{ opacity: 0, y: -20, rotate: -10 }}
      animate={{ opacity: [0, 1, 1, 1, 0], y: [-20, 0, -12, 0, -16], rotate: [-10, 0, -6, 0, -8] }}
      transition={{ duration: 1.3, times: [0, 0.25, 0.5, 0.75, 1] }}
      aria-hidden="true"
    >
      <span className="grid size-14 place-items-center rounded-full bg-milk/90 shadow-[var(--shadow-raised)]">
        <Icon name="hand" size={34} />
      </span>
    </motion.div>
  )
}

/** A ball tossed back and forth between two pets standing side by side. */
export function CatchProp() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-[22%] z-10"
      initial={{ x: '18%', opacity: 0 }}
      animate={{ x: ['18%', '68%', '18%', '68%'], opacity: [0, 1, 1, 1, 0] }}
      transition={{ duration: 2.3, ease: 'easeInOut', opacity: { duration: 2.3, times: [0, 0.05, 0.5, 0.9, 1] } }}
      aria-hidden="true"
    >
      <motion.div
        className="w-[12%] max-w-11"
        animate={{ y: [0, -80, 0, -80, 0, -80, 0], rotate: [0, 180, 360, 540, 720, 900, 1080] }}
        transition={{ duration: 2.3, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 40 40" className="w-full overflow-visible">
          <circle cx={20} cy={20} r={16} fill="#bfe6d1" {...stroke} />
          <path d="M6 14c8 4 20 4 28 0M6 26c8-4 20-4 28 0" fill="none" stroke="#f39bb0" strokeWidth={3.5} strokeLinecap="round" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

/** A yarn rope stretched between two pets for tug-of-war. */
export function TugProp() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-[28%] top-[58%] z-10 h-3"
      initial={{ opacity: 0, scaleX: 0.4 }}
      animate={{ opacity: [0, 1, 1, 0], scaleX: 1 }}
      transition={{ duration: 2.4, times: [0, 0.1, 0.85, 1] }}
      aria-hidden="true"
    >
      <div className="h-full rounded-full border-2 border-cocoa/70 bg-[repeating-linear-gradient(110deg,#cfc3f0_0_8px,#a796d8_8px_12px)]" />
      <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cocoa/70 bg-blush" />
    </motion.div>
  )
}

/** Tiny bowl shown in front of a pet in the room during dinner. */
export function MiniBowl() {
  return (
    <motion.svg
      viewBox="0 0 100 50"
      className="pointer-events-none absolute -bottom-1 left-1/2 w-[70%] -translate-x-1/2 overflow-visible"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.9] }}
      transition={{ duration: 2.3, times: [0, 0.12, 0.85, 1] }}
      aria-hidden="true"
    >
      <motion.g style={{ originX: 0.5, originY: 1 }} animate={{ scaleY: [1, 1, 0.2] }} transition={{ duration: 1.9, times: [0, 0.2, 1] }}>
        {[30, 44, 58, 70].map((x, i) => (
          <ellipse key={x} cx={x} cy={i % 2 ? 22 : 26} rx={8} ry={6} fill={i % 2 ? '#d99e6a' : '#c98a55'} {...stroke} strokeWidth={2} />
        ))}
      </motion.g>
      <path d="M8 26h84a42 22 0 0 1-84 0Z" fill="#f6b8c6" {...stroke} />
    </motion.svg>
  )
}

/** A feather on a stick that swishes above the pet. */
export function FeatherProp() {
  return (
    <motion.div
      className="pointer-events-none absolute -right-[10%] -top-[8%] z-10 w-[34%] max-w-24"
      style={{ originX: 1, originY: 1 }}
      initial={{ opacity: 0, rotate: 20 }}
      animate={{ opacity: [0, 1, 1, 1, 0], rotate: [20, -25, 15, -30, 10, -10] }}
      transition={{ duration: 2.1, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 80" className="w-full overflow-visible">
        <path d="M78 78 32 30" stroke="#c99a74" strokeWidth={4} strokeLinecap="round" />
        <path d="M32 30c-18-4-30-16-28-26 10-2 24 8 28 26Z" fill="#cfc3f0" {...stroke} />
        <path d="M30 28 10 8M22 22l-8 2M18 16l-6-2" fill="none" stroke="#a796d8" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

const BUBBLES = [
  { x: '10%', size: 22, delay: 0 },
  { x: '35%', size: 14, delay: 0.25 },
  { x: '60%', size: 26, delay: 0.1 },
  { x: '80%', size: 16, delay: 0.45 },
  { x: '48%', size: 18, delay: 0.6 },
]

/** Shiny bubbles drifting up around the pet. */
export function BubblesProp() {
  return (
    <div className="pointer-events-none absolute inset-x-[-15%] bottom-[10%] top-[-20%] z-10" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 rounded-full border-2 border-[#9fc9e6] bg-[radial-gradient(circle_at_30%_30%,#fffdf9_0_20%,rgb(207_232_246/0.6)_45%,rgb(246_184_198/0.35)_100%)]"
          style={{ left: b.x, width: b.size, height: b.size }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: [-10, -140, -200], x: [0, i % 2 ? 14 : -14, 0], opacity: [0, 1, 0], scale: [0.4, 1, 1.1] }}
          transition={{ duration: 2.2, delay: b.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
