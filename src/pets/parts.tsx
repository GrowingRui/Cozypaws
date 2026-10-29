import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Accessory, PetMood } from '../game/types'

/** Shared outline + feature colours so all pets read as one family. */
export const INK = '#4a3434'
export const OUTLINE = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
export const BLUSH = '#f6a9bb'
export const NOSE_PINK = '#f39bb0'

type Point = [number, number]

/** Natural, irregular blinking: random gaps, with the odd double blink. */
export function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        setClosed(true)
        timer = setTimeout(() => {
          setClosed(false)
          if (Math.random() < 0.25) {
            timer = setTimeout(() => {
              setClosed(true)
              timer = setTimeout(() => {
                setClosed(false)
                schedule()
              }, 120)
            }, 160)
          } else {
            schedule()
          }
        }, 130)
      }, 2200 + Math.random() * 3600)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [enabled])
  return enabled && closed
}

type EyesProps = {
  mood: PetMood
  blink: boolean
  left: Point
  right: Point
  r?: number
  /** Fur colour, used to draw half-closed lids when tired. */
  lid: string
  lashes?: boolean
}

export function Eyes({ mood, blink, left, right, r = 7.5, lid, lashes }: EyesProps) {
  return (
    <>
      <Eye mood={mood} blink={blink} at={left} r={r} lid={lid} lashes={lashes} side={-1} />
      <Eye mood={mood} blink={blink} at={right} r={r} lid={lid} lashes={lashes} side={1} />
    </>
  )
}

function Eye({ mood, blink, at, r, lid, lashes, side }: { mood: PetMood; blink: boolean; at: Point; r: number; lid: string; lashes?: boolean; side: -1 | 1 }) {
  const [x, y] = at
  if (mood === 'sleeping') {
    return <path d={`M${x - r} ${y} Q${x} ${y + r * 0.9} ${x + r} ${y}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
  }
  if (mood === 'happy' || mood === 'excited') {
    return <path d={`M${x - r} ${y + 3} Q${x} ${y - r * 1.2} ${x + r} ${y + 3}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
  }
  const big = mood === 'hungry'
  const rr = big ? r + 1.2 : r
  return (
    <g>
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        animate={{ scaleY: blink ? 0.1 : 1 }}
        transition={{ duration: 0.07 }}
      >
        <circle cx={x} cy={y} r={rr} fill={INK} />
        <circle cx={x + rr * 0.32} cy={y - rr * 0.36} r={rr * 0.36} fill="#fff" />
        {big && <circle cx={x - rr * 0.38} cy={y + rr * 0.35} r={rr * 0.16} fill="#fff" />}
      </motion.g>
      {mood === 'tired' && (
        <>
          <path d={`M${x - rr - 1.5} ${y} h${rr * 2 + 3} v${-rr - 2} h${-rr * 2 - 3}Z`} fill={lid} />
          <path d={`M${x - rr} ${y} h${rr * 2}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {big && (
        <path
          d={`M${x - side * 2} ${y - rr - 7} L${x + side * 7} ${y - rr - 4}`}
          stroke={INK}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
      {lashes && mood !== 'tired' && (
        <path
          d={`M${x + side * rr * 0.7} ${y - rr * 0.7} l${side * 4} -4 M${x + side * rr} ${y - rr * 0.1} l${side * 5} -1.5`}
          stroke={INK}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      )}
    </g>
  )
}

/** A small "w" mouth that opens for joy, chews while eating and pouts when low. */
export function Mouth({ mood, at, tongue = '#f08fa8' }: { mood: PetMood; at: Point; tongue?: string }) {
  const [x, y] = at
  const line = { fill: 'none', stroke: INK, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (mood) {
    case 'happy':
    case 'excited':
      return (
        <g>
          <path d={`M${x - 8} ${y - 1} Q${x} ${y + 13} ${x + 8} ${y - 1}Z`} fill="#8e3b4f" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <ellipse cx={x} cy={y + 6} rx={4.2} ry={3} fill={tongue} />
        </g>
      )
    case 'eating':
      return (
        <motion.g style={{ originX: 0.5, originY: 0 }} animate={{ scaleY: [0.35, 1, 0.35] }} transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}>
          <ellipse cx={x} cy={y + 3} rx={6} ry={5} fill="#8e3b4f" stroke={INK} strokeWidth={2.5} />
        </motion.g>
      )
    case 'sleeping':
      return <ellipse cx={x} cy={y + 2} rx={2.6} ry={2.2} fill={INK} />
    case 'hungry':
      return <path d={`M${x - 6} ${y + 4} Q${x} ${y - 2} ${x + 6} ${y + 4}`} {...line} />
    case 'tired':
      return <path d={`M${x - 5} ${y + 2} h10`} {...line} />
    default:
      return <path d={`M${x - 8} ${y} q4 5 8 0 q4 5 8 0`} {...line} />
  }
}

export function Cheeks({ mood, left, right }: { mood: PetMood; left: Point; right: Point }) {
  const strength = mood === 'happy' || mood === 'excited' ? 1 : mood === 'hungry' || mood === 'tired' ? 0.45 : 0.8
  return (
    <motion.g animate={{ opacity: strength }} transition={{ duration: 0.4 }}>
      <ellipse cx={left[0]} cy={left[1]} rx={10} ry={6} fill={BLUSH} />
      <ellipse cx={right[0]} cy={right[1]} rx={10} ry={6} fill={BLUSH} />
    </motion.g>
  )
}

/** Drifting "z"s while asleep. */
export function Zzz({ at }: { at: Point }) {
  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={at[0] + i * 9}
          y={at[1] - i * 4}
          fontFamily="Mochiy Pop One, sans-serif"
          fontSize={14 + i * 4}
          fill="#7e6bbd"
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [8, -26], x: [0, 10] }}
          transition={{ duration: 3.3, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }}
        >
          z
        </motion.text>
      ))}
    </g>
  )
}

/** Anchors each rig provides so accessories sit correctly on any species. */
export type AccessoryAnchors = { bow: Point; crown: { center: Point; width: number }; neck: Point }

type AccessoryProps = { kind: Accessory | null | undefined; slot: 'head' | 'neck'; anchors: AccessoryAnchors }

export function AccessoryLayer({ kind, slot, anchors }: AccessoryProps) {
  if (!kind) return null
  if (slot === 'neck' && kind === 'bandana') return <Bandana at={anchors.neck} />
  if (slot === 'neck' && kind === 'friendBandana') return <Bandana at={anchors.neck} fill="#f6a9bb" hearts />
  if (slot === 'head' && kind === 'bow') return <Bow at={anchors.bow} />
  if (slot === 'head' && kind === 'crown') return <Crown {...anchors.crown} />
  return null
}

function Bow({ at: [x, y] }: { at: Point }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(14)`}>
      <path d="M0 0C-12-13-23-2-17 6-13 11-5 6 0 0Z" fill="#f39bb0" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
      <path d="M0 0C12-13 23-2 17 6 13 11 5 6 0 0Z" fill="#f39bb0" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
      <circle r={4.5} fill="#f6b8c6" stroke={INK} strokeWidth={2.8} />
    </g>
  )
}

function Bandana({ at: [x, y], fill = '#9fd8bb', hearts = false }: { at: Point; fill?: string; hearts?: boolean }) {
  return (
    <g>
      <path
        d={`M${x - 30} ${y - 4} Q${x} ${y + 8} ${x + 30} ${y - 4} L${x + 4} ${y + 24} Q${x} ${y + 27} ${x - 4} ${y + 24}Z`}
        fill={fill}
        stroke={INK}
        strokeWidth={2.8}
        strokeLinejoin="round"
      />
      {hearts &&
        [
          [-12, 3],
          [10, 3],
          [0, 13],
        ].map(([dx, dy], i) => (
          <path
            key={`h${i}`}
            d={`M${x + dx!} ${y + dy! + 3}c-3-2-4.5-3.5-4.5-5a2.2 2.2 0 0 1 4.5-1 2.2 2.2 0 0 1 4.5 1c0 1.5-1.5 3-4.5 5Z`}
            fill="#fffdf9"
          />
        ))}
      {!hearts && [
        [-14, 3],
        [0, 8],
        [12, 3],
        [-3, 17],
      ].map(([dx, dy], i) => (
        <circle key={i} cx={x + dx!} cy={y + dy!} r={2} fill="#fffdf9" />
      ))}
    </g>
  )
}

const FLOWER_COLOURS = ['#f6b8c6', '#cfc3f0', '#ffcfae', '#bfe6d1', '#f6b8c6']

function Crown({ center: [cx, cy], width }: { center: Point; width: number }) {
  const half = width / 2
  return (
    <g>
      <path d={`M${cx - half} ${cy + 6} Q${cx} ${cy - 10} ${cx + half} ${cy + 6}`} fill="none" stroke="#7fbf9b" strokeWidth={3.5} strokeLinecap="round" />
      {FLOWER_COLOURS.map((c, i) => {
        const t = i / (FLOWER_COLOURS.length - 1)
        const fx = cx - half + t * width
        const fy = cy + 6 - 16 * (1 - (2 * t - 1) ** 2) * 0.5 - 2
        return (
          <g key={i} transform={`translate(${fx} ${fy})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4} cy={Math.sin((a * Math.PI) / 180) * 4} r={3.6} fill={c} stroke={INK} strokeWidth={1.4} />
            ))}
            <circle r={2.4} fill="#ffe29a" stroke={INK} strokeWidth={1.2} />
          </g>
        )
      })}
    </g>
  )
}
