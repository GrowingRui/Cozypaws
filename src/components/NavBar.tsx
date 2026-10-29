import { motion } from 'motion/react'
import { Icon, type IconName } from './Icon'
import { springs } from './tones'

export type Tab = 'home' | 'walk' | 'bag' | 'shop'

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'walk', label: 'Walk', icon: 'paw' },
  { id: 'bag', label: 'Bag', icon: 'bag' },
  { id: 'shop', label: 'Shop', icon: 'shop' },
]

type NavBarProps = { active: Tab; onChange: (tab: Tab) => void }

export function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav aria-label="Main" className="sticker mx-auto flex w-full max-w-md gap-1 p-1.5 shadow-[var(--shadow-float)]">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            className={`group relative flex min-h-12 flex-1 items-center justify-center gap-1 rounded-[var(--radius-chip)] px-1 text-[0.8125rem] sm:gap-1.5 sm:px-2 sm:text-sm font-bold transition-[opacity,transform] duration-200 ease-[var(--ease-spring)] active:scale-95 ${
              isActive ? 'text-cocoa' : 'text-cocoa-soft hover:-translate-y-0.5'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-[var(--radius-chip)] bg-blush-soft"
                transition={springs.settle}
              />
            )}
            <Icon name={tab.icon} size={20} className="relative" />
            <span className="relative">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
