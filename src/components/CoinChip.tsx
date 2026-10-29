import { motion } from 'motion/react'
import { Icon } from './Icon'

/** Shared coin counter. Pops whenever the amount changes. */
export function CoinChip({ coins }: { coins: number }) {
  return (
    <motion.div
      key={coins}
      className="sticker flex shrink-0 items-center gap-1.5 px-3 py-2 font-bold text-[#b5602b]"
      aria-label={`${coins} coins`}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.35 }}
    >
      <Icon name="coin" size={20} />
      <span className="tabular-nums text-cocoa">{coins}</span>
    </motion.div>
  )
}
