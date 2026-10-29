import type { ReactNode } from 'react'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { INK } from '../pets/parts'

/**
 * Side-scrolling park. Every layer is a tile shown twice side by side; one shared "distance"
 * value drives them all at different speeds (parallax), so pausing and resuming is seamless.
 */

/** Container widths travelled per second by the nearest layer. Others are fractions of it. */
const GROUND_SPEED = 0.11

const LAYERS = { clouds: 0.08, farHills: 0.15, nearHills: 0.3, trees: 0.55, path: 1, front: 1.25 }

/** A periodic hill line across an 800-wide tile (integer frequencies, so the ends match). */
function hillPath(base: number, waves: [number, number, number][], height: number) {
  const pts: string[] = []
  for (let x = 0; x <= 800; x += 16) {
    const y = waves.reduce((acc, [amp, freq, phase]) => acc + amp * Math.sin((2 * Math.PI * freq * x) / 800 + phase), base)
    pts.push(`${x},${y.toFixed(1)}`)
  }
  return `M0,${height} L${pts.join(' L')} L800,${height} Z`
}

const FAR_HILLS = hillPath(52, [[12, 2, 0.4], [6, 5, 1.3]], 100)
const NEAR_HILLS = hillPath(62, [[10, 3, 2.1], [5, 7, 0.2]], 100)

function Loop({ distance, speed, className, children }: { distance: MotionValue<number>; speed: number; className: string; children: ReactNode }) {
  const x = useTransform(distance, (d) => `${-((d * speed * 50) % 50)}%`)
  return (
    <div className={`pointer-events-none absolute inset-x-0 overflow-hidden ${className}`} aria-hidden="true">
      <motion.div className="flex h-full w-[200%]" style={{ x }}>
        <div className="relative h-full w-1/2">{children}</div>
        <div className="relative h-full w-1/2">{children}</div>
      </motion.div>
    </div>
  )
}

function Tree({ kind, className, style }: { kind: 'round' | 'blossom' | 'pine'; className?: string; style?: React.CSSProperties }) {
  const stroke = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 80 110" className={`absolute bottom-0 overflow-visible ${className ?? ''}`} style={style}>
      <rect x={34} y={70} width={12} height={40} rx={5} fill="#c99a74" {...stroke} />
      {kind === 'pine' ? (
        <path d="M40 6 70 74H10Z" fill="#8fcaa9" {...stroke} />
      ) : (
        <>
          <circle cx={40} cy={44} r={32} fill={kind === 'blossom' ? '#f8c8d4' : '#9fd4b6'} {...stroke} />
          {kind === 'blossom' &&
            [
              [28, 34],
              [50, 30],
              [44, 54],
              [24, 54],
            ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3.5} fill="#fffdf9" />)}
          {kind === 'round' && <path d="M24 40c4-8 12-12 20-12" fill="none" stroke="#c4e8d3" strokeWidth={5} strokeLinecap="round" />}
        </>
      )}
    </svg>
  )
}

const CLOUDS = [
  { left: '6%', top: '14%', w: '5.5rem' },
  { left: '42%', top: '8%', w: '7rem' },
  { left: '74%', top: '20%', w: '4.5rem' },
]
const TREES: { left: string; kind: 'round' | 'blossom' | 'pine'; size: string }[] = [
  { left: '4%', kind: 'round', size: '4.5rem' },
  { left: '19%', kind: 'pine', size: '3.5rem' },
  { left: '33%', kind: 'blossom', size: '5rem' },
  { left: '55%', kind: 'round', size: '3.8rem' },
  { left: '68%', kind: 'blossom', size: '4.2rem' },
  { left: '84%', kind: 'pine', size: '4.4rem' },
]
const FLOWERS = ['#f6b8c6', '#cfc3f0', '#ffe29a', '#f6b8c6', '#ffcfae', '#cfc3f0', '#ffe29a', '#f6b8c6']

type ParkSceneProps = {
  moving: boolean
  label: string
  children?: ReactNode
  /** Elements that should scroll with the ground (puddles, visitors) or float above it. */
  overlay?: ReactNode
  /** Shorter on phones, e.g. while planning a walk so the controls fit. */
  compact?: boolean
}

export function ParkScene({ moving, label, children, overlay, compact = false }: ParkSceneProps) {
  const distance = useMotionValue(0)
  const reduced = useReducedMotion()
  useAnimationFrame((_, delta) => {
    if (moving && !reduced) distance.set(distance.get() + (delta / 1000) * GROUND_SPEED)
  })

  return (
    <section aria-label={label} className="relative overflow-hidden rounded-[var(--radius-stage)] bg-milk p-2.5 shadow-[var(--shadow-float)] sm:p-3">
      <div className={`relative isolate ${compact ? 'h-[clamp(13rem,30dvh,30rem)]' : 'h-[clamp(17rem,44dvh,30rem)]'} overflow-hidden rounded-[calc(var(--radius-stage)-0.625rem)] bg-gradient-to-b from-[#cfe8f6] via-[#f3eefb] to-[#fff6ea] shadow-[inset_0_6px_18px_rgb(74_52_52/0.12)] lg:h-[min(60dvh,32rem)]`}>
        {/* Sun */}
        <div className="absolute right-[10%] top-[9%] size-14 rounded-full bg-[#fff1b8] shadow-[0_0_0_10px_rgb(255_241_184/0.45),0_0_40px_14px_rgb(255_241_184/0.6)]" />

        <Loop distance={distance} speed={LAYERS.clouds} className="inset-y-0">
          {CLOUDS.map((c) => (
            <div key={c.left} className="absolute" style={{ left: c.left, top: c.top, width: c.w }}>
              <div className="relative h-6 w-full rounded-full bg-milk/95">
                <span className="absolute -top-3 left-[22%] size-8 rounded-full bg-milk/95" />
                <span className="absolute -top-5 left-[45%] size-10 rounded-full bg-milk/95" />
              </div>
            </div>
          ))}
        </Loop>

        <Loop distance={distance} speed={LAYERS.farHills} className="bottom-[24%] h-[40%]">
          <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d={FAR_HILLS} fill="#ddd3f4" />
          </svg>
        </Loop>

        <Loop distance={distance} speed={LAYERS.nearHills} className="bottom-[22%] h-[30%]">
          <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d={NEAR_HILLS} fill="#c6e9d5" />
          </svg>
        </Loop>

        <Loop distance={distance} speed={LAYERS.trees} className="bottom-[22%] h-[34%]">
          {TREES.map((t) => (
            <Tree key={t.left} kind={t.kind} style={{ left: t.left, width: t.size }} />
          ))}
        </Loop>

        {/* Grass + path */}
        <div className="absolute inset-x-0 bottom-0 h-[25%] bg-[#bfe6d1]" />
        <Loop distance={distance} speed={LAYERS.path} className="bottom-[3%] h-[17%]">
          <div className="absolute inset-0 bg-[#ffe6cf] shadow-[inset_0_3px_0_rgb(255_255_255/0.6),inset_0_-3px_0_rgb(181_96_43/0.12)]" />
          {[8, 26, 47, 63, 81, 93].map((left, i) => (
            <span
              key={left}
              className="absolute rounded-full bg-[#f3cfae]"
              style={{ left: `${left}%`, top: i % 2 ? '58%' : '28%', width: i % 3 ? '1.1rem' : '0.75rem', height: '0.45rem' }}
            />
          ))}
        </Loop>

        {overlay}

        {/* Walkers */}
        <div className="absolute inset-x-0 bottom-[8%] h-[46%]">{children}</div>

        <Loop distance={distance} speed={LAYERS.front} className="bottom-0 h-[9%]">
          {FLOWERS.map((color, i) => (
            <span key={i} className="absolute bottom-[10%] flex flex-col items-center" style={{ left: `${4 + i * 12.5}%` }}>
              <span className="size-3 rounded-full border-2 border-cocoa/70" style={{ background: color }} />
              <span className="h-3 w-0.5 bg-[#7fbf9b]" />
            </span>
          ))}
          {[10, 35, 60, 85].map((left) => (
            <span key={left} className="absolute bottom-0 h-3 w-6 rounded-t-full bg-[#9fd4b6]" style={{ left: `${left}%` }} />
          ))}
        </Loop>
      </div>
    </section>
  )
}
