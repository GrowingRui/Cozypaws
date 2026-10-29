import { motion } from 'motion/react'

/** Temporary stand-in until the real pet rigs land in step 2. Same footprint as a pet. */
export function PlaceholderPet() {
  return (
    <motion.svg
      viewBox="0 0 200 180"
      className="h-auto w-[min(52vw,15rem)] origin-bottom"
      animate={{ scaleY: [1, 1.035, 1], scaleX: [1, 0.985, 1] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      role="img"
      aria-label="Pet placeholder"
    >
      <ellipse cx="100" cy="172" rx="62" ry="7" fill="#4a3434" opacity=".1" />
      <path d="M52 52 44 18l34 20ZM148 52l8-34-34 20Z" fill="#fbdbe2" stroke="#4a3434" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="100" cy="110" rx="70" ry="62" fill="#fffdf9" stroke="#4a3434" strokeWidth="3" />
      <ellipse cx="72" cy="120" rx="10" ry="6" fill="#f6b8c6" />
      <ellipse cx="128" cy="120" rx="10" ry="6" fill="#f6b8c6" />
      <circle cx="78" cy="103" r="6" fill="#4a3434" />
      <circle cx="122" cy="103" r="6" fill="#4a3434" />
      <circle cx="80" cy="101" r="2" fill="#fff" />
      <circle cx="124" cy="101" r="2" fill="#fff" />
      <path d="M93 117q7 6 14 0" fill="none" stroke="#4a3434" strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  )
}
