import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { springs } from './tones'

type TrayShellProps = {
  id: string
  title: string
  label: string
  onClose: () => void
  children: ReactNode
}

/**
 * A panel that opens from an action button (Feed, Play, Together). It stays open so actions can be
 * repeated quickly. Focus moves to its first button on open; Escape closes it.
 */
export function TrayShell({ id, title, label, onClose, children }: TrayShellProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[data-tray-body] button:not([disabled])')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      id={id}
      role="group"
      aria-label={label}
      className="sticker stitch p-3 sm:p-4"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={springs.settle}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="-my-2 -mr-2 min-h-11 rounded-full px-4 text-sm font-bold text-cocoa-soft hover:bg-cocoa/5 active:scale-95"
        >
          Close
        </button>
      </div>
      <div data-tray-body>{children}</div>
    </motion.div>
  )
}

type TrayOptionProps = {
  icon: ReactNode
  title: string
  lines: string[]
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
  chip: string
}

/** One choice inside a tray: icon, name and a short effect summary. */
export function TrayOption({ icon, title, lines, onClick, disabled, ariaLabel, chip }: TrayOptionProps) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={springs.pop}
      className="flex flex-col items-center gap-1 rounded-[var(--radius-chip)] bg-cream px-1 py-2 text-center shadow-[var(--shadow-base)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative grid size-11 place-items-center rounded-full ${chip}`}>{icon}</span>
      <span className="text-[0.8125rem] font-bold leading-tight">{title}</span>
      <span className="flex flex-col text-[0.6875rem] leading-tight text-cocoa-soft">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </motion.button>
  )
}
