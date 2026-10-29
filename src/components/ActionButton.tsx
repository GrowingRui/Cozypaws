import type { Ref } from 'react'
import { motion } from 'motion/react'
import { Icon, type IconName } from './Icon'
import { springs, toneClasses, type Tone } from './tones'

type ActionButtonProps = {
  icon: IconName
  label: string
  tone: Tone
  onClick?: () => void
  disabled?: boolean
  /** Optional small count badge, e.g. food left in the bag. */
  badge?: number
  /** For buttons that open a panel. */
  expanded?: boolean
  controls?: string
  ref?: Ref<HTMLButtonElement>
}

export function ActionButton({ icon, label, tone, onClick, disabled, badge, expanded, controls, ref }: ActionButtonProps) {
  const t = toneClasses[tone]
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controls}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.9, y: 1 }}
      transition={springs.pop}
      className="sticker stitch group flex min-h-[4.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-cocoa sm:px-2 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className={`relative grid size-10 place-items-center rounded-full ${t.chip} ${t.ink}`}>
        <Icon name={icon} size={24} />
        {badge !== undefined && (
          <span aria-label={`${badge} left`} className="absolute -right-2 -top-1 min-w-5 rounded-full bg-cocoa px-1 text-center text-[0.6875rem] font-bold leading-5 text-milk">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[0.8125rem] font-bold leading-none">{label}</span>
    </motion.button>
  )
}
