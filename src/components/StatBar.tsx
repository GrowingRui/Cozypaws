import { motion } from 'motion/react'
import { Icon, type IconName } from './Icon'
import { springs, toneClasses, type Tone } from './tones'

type StatBarProps = {
  label: string
  icon: IconName
  tone: Tone
  /** 0–100. Higher is always better. */
  value: number
}

export function StatBar({ label, icon, tone, value }: StatBarProps) {
  const t = toneClasses[tone]
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const low = v < 25
  return (
    <div className="flex items-center gap-2">
      <motion.span
        className={`grid size-8 shrink-0 place-items-center rounded-full ${t.chip} ${t.ink}`}
        // A gentle wobble draws the eye to a need that is running low.
        animate={low ? { rotate: [0, -12, 10, -6, 0] } : { rotate: 0 }}
        transition={low ? { duration: 0.9, repeat: Infinity, repeatDelay: 2.4 } : springs.settle}
      >
        <Icon name={icon} size={18} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between text-[0.8125rem] leading-5">
          <span className="font-bold">{label}</span>
          <span className="tabular-nums text-cocoa-soft">{v}</span>
        </div>
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={v}
          className={`h-2.5 overflow-hidden rounded-full ${t.track}`}
        >
          {/* scaleX keeps the animation on transform only. */}
          <motion.div
            className={`h-full w-full origin-left rounded-full ${t.fill}`}
            initial={false}
            animate={{ scaleX: v / 100 }}
            transition={springs.settle}
          />
        </div>
      </div>
    </div>
  )
}
