import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useReducedMotion } from 'motion/react'
import type { CompanionMode, DecorId, PetState } from '../game/state'
import type { PetMood } from '../game/types'
import { INK } from '../pets/parts'
import { PetSprite } from '../pets/PetSprite'

/**
 * A calm study corner: desk, lamp, books and a window. Deliberately low on movement:
 * nappers sleep on cushions and others drift slowly around the floor.
 */

const CUSHION_SPOTS = [
  { left: '4%', width: 'min(24%, 8.5rem)' },
  { left: '24%', width: 'min(22%, 8rem)' },
  { left: '44%', width: 'min(20%, 7rem)' },
  { left: '62%', width: 'min(20%, 7rem)' },
]

type StudyRoomProps = {
  companions: { pet: PetState; mode: CompanionMode }[]
  /** 'focus' keeps things calm; 'break' wakes everyone up; 'idle' is the setup preview. */
  phase: 'focus' | 'break' | 'idle'
  compact?: boolean
  /** Decorations bought in the shop. */
  decor?: DecorId[]
}

const BULBS = ['#ffe29a', '#f6b8c6', '#bfe6d1', '#cfc3f0', '#ffcfae', '#ffe29a', '#f6b8c6', '#bfe6d1', '#cfc3f0']

export function StudyRoom({ companions, phase, compact = false, decor = [] }: StudyRoomProps) {
  const nappers = companions.filter((c) => c.mode === 'nap')
  const hangers = companions.filter((c) => c.mode === 'hang')
  const lampOn = phase === 'focus'

  return (
    <section aria-label="Study room" className="relative overflow-hidden rounded-[var(--radius-stage)] bg-milk p-2.5 shadow-[var(--shadow-float)] sm:p-3">
      <div
        className={`relative isolate overflow-hidden rounded-[calc(var(--radius-stage)-0.625rem)] shadow-[inset_0_6px_18px_rgb(74_52_52/0.14)] ${
          compact ? 'h-[clamp(13rem,30dvh,30rem)]' : 'h-[clamp(16rem,40dvh,30rem)]'
        } lg:h-[min(60dvh,32rem)]`}
      >
        {/* Warm wall with soft blush stripes */}
        <div className="absolute inset-0 -z-10" style={{ background: 'repeating-linear-gradient(90deg, #fdeef2 0 30px, #fbe4ea 30px 60px)' }} />
        {/* Window */}
        <div className="absolute left-[7%] top-[9%] h-[34%] w-[24%] min-w-20 overflow-hidden rounded-2xl border-[6px] border-milk bg-gradient-to-b from-[#cfe8f6] to-[#f3eaff] shadow-[var(--shadow-base)]">
          <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 bg-milk" />
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-milk" />
        </div>
        {/* Bookshelf */}
        <div className="absolute left-[38%] top-[14%] w-[22%] min-w-24">
          <div className="flex items-end gap-1 px-2">
            {['#cfc3f0', '#f6b8c6', '#bfe6d1', '#ffcfae', '#cfc3f0'].map((c, i) => (
              <span key={i} className="w-3 rounded-t-sm border-2 border-cocoa/60" style={{ background: c, height: `${1.4 + (i % 3) * 0.35}rem` }} />
            ))}
          </div>
          <div className="h-2.5 rounded-full bg-[#e9c3a3] shadow-[var(--shadow-base)]" />
        </div>
        {decor.includes('lights') && (
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 top-[3%] h-[12%] w-full overflow-visible" aria-label="Fairy lights">
            <path d="M0 6 Q100 34 200 10 T400 8" fill="none" stroke="#7a5f5c" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            {BULBS.map((c, i) => {
              const x = 20 + i * 45
              const y = i % 2 ? 22 : 16
              return (
                <motion.ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx={5}
                  ry={7}
                  fill={c}
                  stroke="#4a3434"
                  strokeWidth={1.2}
                  vectorEffect="non-scaling-stroke"
                  animate={{ opacity: [1, 0.55, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: (i % 3) * 0.8 }}
                />
              )
            })}
          </svg>
        )}
        {/* Floor */}
        <div className="absolute inset-x-0 bottom-[30%] h-3 bg-milk" />
        <div
          className="absolute inset-x-0 bottom-0 h-[30%]"
          style={{ background: 'repeating-linear-gradient(90deg, rgb(0 0 0 / 0) 0 78px, rgb(181 96 43 / 0.12) 78px 80px), linear-gradient(#ffe0c9, #ffd2b4)' }}
        />

        {/* Desk with lamp, books and a steaming mug */}
        <div className="absolute bottom-[14%] right-[4%] w-[30%] min-w-32">
          <svg viewBox="0 0 160 120" className="w-full overflow-visible" aria-hidden="true">
            <motion.ellipse
              cx={46}
              cy={58}
              rx={70}
              ry={46}
              fill="#fff1b8"
              initial={false}
              animate={{ opacity: lampOn ? 0.55 : 0 }}
              transition={{ duration: 0.8 }}
            />
            <rect x={6} y={62} width={148} height={12} rx={6} fill="#e9c3a3" stroke={INK} strokeWidth={3} />
            <rect x={16} y={74} width={10} height={44} rx={4} fill="#d9ad8a" stroke={INK} strokeWidth={3} />
            <rect x={134} y={74} width={10} height={44} rx={4} fill="#d9ad8a" stroke={INK} strokeWidth={3} />
            {/* Lamp */}
            <path d="M36 62V34l14-14" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <path d="M40 22 60 8l14 18-24 6Z" fill={lampOn ? '#ffe29a' : '#f6b8c6'} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <ellipse cx={36} cy={62} rx={12} ry={4} fill="#cfc3f0" stroke={INK} strokeWidth={3} />
            {/* Books */}
            <rect x={82} y={50} width={40} height={6} rx={2} fill="#bfe6d1" stroke={INK} strokeWidth={2.5} />
            <rect x={86} y={43} width={34} height={7} rx={2} fill="#cfc3f0" stroke={INK} strokeWidth={2.5} />
            <rect x={80} y={56} width={44} height={6} rx={2} fill="#ffcfae" stroke={INK} strokeWidth={2.5} />
            {/* Mug */}
            <rect x={130} y={44} width={16} height={18} rx={4} fill="#fffdf9" stroke={INK} strokeWidth={2.5} />
            <motion.path
              d="M136 38c-3-4 3-6 0-10M142 38c-3-4 3-6 0-10"
              fill="none"
              stroke="#c9b8a8"
              strokeWidth={2}
              strokeLinecap="round"
              animate={{ opacity: [0.2, 0.7, 0.2], y: [0, -3, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>

        {decor.includes('plant') && (
          <svg viewBox="0 0 60 90" className="absolute bottom-[12%] right-[33%] w-[8%] min-w-10 overflow-visible" aria-label="Desk plant">
            <path d="M30 52C14 44 8 26 14 14c10 6 16 20 16 38ZM30 52c16-8 22-26 16-38-10 6-16 20-16 38Z" fill="#9fd4b6" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M30 52C28 34 30 18 30 6" fill="none" stroke="#7fbf9b" strokeWidth={3} strokeLinecap="round" />
            <path d="M14 52h32l-4 32a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4Z" fill="#ffcfae" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          </svg>
        )}
        {/* Cushions with nappers */}
        {nappers.map(({ pet }, i) => (
          <div key={pet.id} className="absolute bottom-[6%]" style={CUSHION_SPOTS[i]}>
            <div className="absolute inset-x-[2%] bottom-0 h-[26%] rounded-[50%] bg-lavender shadow-[inset_0_-5px_0_rgb(74_52_52/0.08)]" />
            <PetSprite
              species={pet.species}
              mood={phase === 'break' ? 'happy' : phase === 'focus' ? 'sleeping' : 'idle'}
              accessory={pet.accessory}
              label={`${pet.name} ${phase === 'focus' ? 'is napping' : 'is resting here'}`}
              className="relative w-full"
            />
          </div>
        ))}

        {/* Pets hanging out drift around the middle of the floor */}
        {hangers.map(({ pet }, i) => (
          <Wanderer key={pet.id} pet={pet} index={i} phase={phase} />
        ))}
      </div>
    </section>
  )
}

/** A pet that slowly wanders between spots, pausing to sit, stretch or look around. */
function Wanderer({ pet, index, phase }: { pet: PetState; index: number; phase: StudyRoomProps['phase'] }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [mood, setMood] = useState<PetMood>('idle')
  const reduced = useReducedMotion()
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    if (phase !== 'focus' || reduced) {
      setMood(phase === 'break' ? 'happy' : 'idle')
      return () => {
        alive.current = false
      }
    }
    let x = 0
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    void (async () => {
      await wait(1500 + index * 2500)
      while (alive.current) {
        const target = Math.round((Math.random() * 2.4 - 1.2) * 100) / 100
        const distance = Math.abs(target - x)
        setMood('walking')
        await animate(scope.current, { x: `${target * 100}%` }, { duration: 2 + distance * 3.5, ease: 'easeInOut' })
        x = target
        if (!alive.current) break
        // Sit for a while; now and then stretch happily.
        setMood(Math.random() < 0.25 ? 'happy' : 'idle')
        await wait(1200)
        setMood('idle')
        await wait(6000 + Math.random() * 8000)
      }
    })()
    return () => {
      alive.current = false
    }
  }, [phase, reduced, index, animate, scope])

  return (
    <div className="absolute bottom-[8%]" style={{ left: `${40 + index * 8}%`, width: 'min(20%, 7rem)' }}>
      <motion.div ref={scope}>
        <PetSprite species={pet.species} mood={mood} accessory={pet.accessory} label={`${pet.name} is keeping you company`} className="w-full" />
      </motion.div>
    </div>
  )
}
