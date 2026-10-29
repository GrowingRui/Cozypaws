import { useMemo } from 'react'
import { motion } from 'motion/react'

const HEART = 'M12 20.5s-8-4.9-8-10.6A4.6 4.6 0 0 1 12 7.1a4.6 4.6 0 0 1 8 2.8c0 5.7-8 10.6-8 10.6Z'
const SPARKLE = 'M12 2.5c.7 5 3.5 7.8 8.5 8.5-5 .7-7.8 3.5-8.5 8.5-.7-5-3.5-7.8-8.5-8.5 5-.7 7.8-3.5 8.5-8.5Z'

export type BurstKind = 'hearts' | 'sparkles' | 'crumbs' | 'stars'

const CONFIG: Record<BurstKind, { count: number; spread: number; colors: string[]; size: [number, number]; rise: number }> = {
  hearts: { count: 7, spread: 70, colors: ['#e5799a', '#f39bb0', '#b0436c'], size: [16, 26], rise: 120 },
  sparkles: { count: 10, spread: 110, colors: ['#e9b949', '#cfc3f0', '#f39bb0'], size: [14, 24], rise: 110 },
  crumbs: { count: 9, spread: 50, colors: ['#e7b27e', '#d99e6a', '#f7d8ae'], size: [5, 8], rise: 40 },
  stars: { count: 8, spread: 90, colors: ['#e9b949', '#9fd8bb', '#cfc3f0'], size: [12, 20], rise: 90 },
}

/**
 * A one-shot particle burst. Give it a new `id` to fire again: the id is the key,
 * so every burst mounts fresh and its animation always replays.
 */
export function Burst({ kind, x = '50%', y = '50%' }: { kind: BurstKind; x?: string; y?: string }) {
  const cfg = CONFIG[kind]
  const particles = useMemo(
    () =>
      Array.from({ length: cfg.count }, (_, i) => {
        const angle = (-90 + (Math.random() - 0.5) * cfg.spread * 2) * (Math.PI / 180)
        const dist = cfg.rise * (0.55 + Math.random() * 0.6)
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist * (kind === 'crumbs' ? -0.6 : 1),
          rot: (Math.random() - 0.5) * 60,
          size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
          color: cfg.colors[i % cfg.colors.length]!,
          delay: Math.random() * 0.15,
        }
      }),
    [cfg, kind],
  )

  return (
    <div className="pointer-events-none absolute z-20" style={{ left: x, top: y }} aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ color: p.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{
            x: p.dx,
            y: kind === 'crumbs' ? [0, p.dy, p.dy + 30] : p.dy,
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1, 1, 0.8],
            rotate: p.rot,
          }}
          transition={{ duration: kind === 'crumbs' ? 0.9 : 1.3, delay: p.delay, ease: 'easeOut' }}
        >
          {kind === 'crumbs' ? (
            <span className="block rounded-full" style={{ width: p.size, height: p.size, background: p.color }} />
          ) : (
            <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="currentColor" stroke="#4a3434" strokeWidth={1.4} strokeLinejoin="round">
              <path d={kind === 'hearts' ? HEART : SPARKLE} />
            </svg>
          )}
        </motion.span>
      ))}
    </div>
  )
}
