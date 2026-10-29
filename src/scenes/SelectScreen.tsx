import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { Icon } from '../components/Icon'
import { springs, toneClasses } from '../components/tones'
import { NAME_MAX, SPECIES, SPECIES_ORDER, suggestName, validateName } from '../game/pets'
import type { AdoptedPet, PetMood, Species } from '../game/types'
import { PetSprite } from '../pets/PetSprite'

type Reaction = { mood: PetMood; line: string; key: number }

const pick = <T,>(list: T[], avoid?: T) => {
  const options = list.length > 1 ? list.filter((x) => x !== avoid) : list
  return options[Math.floor(Math.random() * options.length)]!
}

type SelectScreenProps = {
  onAdopt: (pet: AdoptedPet) => void
  /** When set, this is an additional adoption and the screen offers a way back home. */
  onCancel?: () => void
  /** Names already used in the household. */
  takenNames?: string[]
  spotsLeft?: number
}

export function SelectScreen({ onAdopt, onCancel, takenNames = [], spotsLeft }: SelectScreenProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [names, setNames] = useState(
    () => Object.fromEntries(SPECIES_ORDER.map((id) => [id, suggestName(id, takenNames)])) as Record<Species, string>,
  )
  const [error, setError] = useState<string | null>(null)
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([])

  const species = SPECIES_ORDER[index]!
  const info = SPECIES[species]
  const name = names[species]
  const tone = toneClasses[info.tone]

  // Reactions are keyed so the same reaction replays every time it is triggered.
  const react = (mood: PetMood, sp: Species = species) =>
    setReaction((prev) => ({ mood, line: pick(SPECIES[sp].greetings, prev?.line), key: (prev?.key ?? 0) + 1 }))

  useEffect(() => {
    if (!reaction) return
    const t = setTimeout(() => setReaction(null), 1800)
    return () => clearTimeout(t)
  }, [reaction])

  const select = (next: number, focus = false) => {
    const wrapped = (next + SPECIES_ORDER.length) % SPECIES_ORDER.length
    setDirection(next > index || (index === SPECIES_ORDER.length - 1 && wrapped === 0) ? 1 : -1)
    setIndex(wrapped)
    setError(null)
    react('happy', SPECIES_ORDER[wrapped]!)
    if (focus) radioRefs.current[wrapped]?.focus()
  }

  const onRadioKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      select(index + 1, true)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      select(index - 1, true)
    }
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) select(index + 1)
    else if (info.offset.x > 60 || info.velocity.x > 400) select(index - 1)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const problem = validateName(name, takenNames)
    setError(problem)
    if (problem) return
    onAdopt({ species, name: name.trim() })
  }

  const displayName = name.trim() || `your ${info.kind.toLowerCase()}`
  const mood: PetMood = reaction?.mood ?? 'idle'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-3 pb-12 pt-6 sm:px-6 lg:pt-12">
      <header className="relative flex flex-col gap-2 text-center lg:text-left">
        {onCancel ? (
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.pop}
            className="sticker flex min-h-11 items-center gap-1 self-start py-2 pl-2 pr-4 text-sm font-bold"
          >
            <Icon name="chevronLeft" size={20} />
            Back home
          </motion.button>
        ) : (
          <p className="flex items-center justify-center gap-2 font-display text-lg text-berry lg:justify-start">
            <Icon name="paw" size={22} />
            CozyPaws
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl">{onCancel ? 'Who else is coming home?' : 'Who’s coming home with you?'}</h1>
        <p className="text-cocoa-soft">
          {onCancel && spotsLeft !== undefined
            ? `There’s room for ${spotsLeft} more ${spotsLeft === 1 ? 'friend' : 'friends'}.`
            : 'Meet each little one, then choose a name.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          {/* Preview stage */}
          <section
            aria-label={`${info.kind} preview`}
            className="relative rounded-[var(--radius-stage)] bg-milk p-2.5 shadow-[var(--shadow-float)] sm:p-3"
          >
            <div className="relative isolate h-[min(50dvh,26rem)] min-h-[17rem] overflow-hidden rounded-[calc(var(--radius-stage)-0.625rem)] shadow-[inset_0_6px_18px_rgb(74_52_52/0.12)]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={species}
                  className="absolute inset-0 -z-10"
                  style={{ background: info.backdrop }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </AnimatePresence>
              {/* Soft dotted fabric */}
              <div
                className="absolute inset-0 -z-10 opacity-40"
                style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.9) 1.6px, transparent 1.8px)', backgroundSize: '22px 22px' }}
              />
              {/* Cushion */}
              <div className="absolute bottom-[9%] left-1/2 h-[17%] w-[60%] max-w-[22rem] -translate-x-1/2 rounded-[50%] bg-milk/80 shadow-[inset_0_-6px_0_rgb(74_52_52/0.06),0_10px_24px_-12px_rgb(74_52_52/0.3)]">
                <div className="absolute inset-2 rounded-[50%] border-2 border-dashed border-cocoa/10" />
              </div>

              <AnimatePresence>
                {reaction && (
                  <motion.p
                    key={reaction.key}
                    role="status"
                    className="sticker absolute left-1/2 top-5 z-10 w-max max-w-[70%] -translate-x-1/2 px-4 py-2 text-center text-sm font-bold"
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={springs.pop}
                  >
                    {reaction.line}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div
                className="absolute inset-x-0 bottom-[12%] flex cursor-grab touch-pan-y justify-center active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={onDragEnd}
              >
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.button
                    key={species}
                    type="button"
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({ x: `${d * 70}%`, opacity: 0, scale: 0.8 }),
                      center: { x: 0, opacity: 1, scale: 1 },
                      exit: (d: number) => ({ x: `${d * -70}%`, opacity: 0, scale: 0.8 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={springs.settle}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => react('excited')}
                    aria-label={`Say hi to the ${info.kind.toLowerCase()}`}
                    className="rounded-[2rem] outline-offset-8"
                  >
                    <PetSprite species={species} mood={mood} label="" className="pointer-events-none w-[min(58vw,16rem)]" />
                  </motion.button>
                </AnimatePresence>
              </motion.div>

              <StageArrow side="left" onClick={() => select(index - 1)} />
              <StageArrow side="right" onClick={() => select(index + 1)} />
            </div>
          </section>

          {/* Picker */}
          <div role="radiogroup" aria-label="Choose a pet" className="grid grid-cols-4 gap-2 sm:gap-3" onKeyDown={onRadioKey}>
            {SPECIES_ORDER.map((id, i) => {
              const selected = i === index
              const t = toneClasses[SPECIES[id].tone]
              return (
                <motion.button
                  key={id}
                  ref={(el) => {
                    radioRefs.current[i] = el
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => (selected ? react('happy') : select(i))}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.93 }}
                  animate={{ y: selected ? -4 : 0 }}
                  transition={springs.pop}
                  className="sticker relative flex flex-col items-center gap-1 px-1 pb-2 pt-2"
                >
                  {selected && (
                    <motion.span layoutId="picker-pill" className={`absolute inset-0 rounded-[var(--radius-sticker)] ${t.chip}`} transition={springs.settle} />
                  )}
                  <PetSprite species={id} label="" className="relative w-[min(16vw,4.5rem)]" />
                  <span className="relative text-[0.8125rem] font-bold leading-none">{SPECIES[id].kind}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Details + naming */}
        <section aria-live="polite" className="sticker stitch flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={species}
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <h2 className="text-3xl sm:text-4xl">{info.kind}</h2>
              <p className="font-bold text-cocoa-soft">{info.tagline}</p>
              <ul className="flex flex-wrap gap-2" aria-label="Personality">
                {info.traits.map((trait) => (
                  <li key={trait} className={`rounded-full px-3 py-1 text-sm font-bold ${tone.chip} ${tone.ink}`}>
                    {trait}
                  </li>
                ))}
              </ul>
              <p className="max-w-prose">{info.description}</p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={submit} noValidate className="mt-2 flex flex-col gap-3 border-t-2 border-dashed border-cocoa/10 pt-4">
            <label htmlFor="pet-name" className="font-bold">
              Name your {info.kind.toLowerCase()}
            </label>
            <div className="flex gap-2">
              <input
                id="pet-name"
                value={name}
                maxLength={NAME_MAX}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'pet-name-error' : undefined}
                onChange={(e) => {
                  setNames((n) => ({ ...n, [species]: e.target.value }))
                  if (error) setError(null)
                }}
                className="min-h-12 min-w-0 flex-1 rounded-[var(--radius-chip)] border-2 border-cocoa/15 bg-cream px-4 font-display text-lg text-cocoa shadow-[inset_0_2px_4px_rgb(74_52_52/0.06)] outline-none placeholder:text-cocoa-soft/60 focus-visible:border-berry focus-visible:outline-none aria-[invalid=true]:border-berry"
              />
              <motion.button
                type="button"
                aria-label="Suggest a name"
                title="Suggest a name"
                whileHover={{ rotate: -12, y: -2 }}
                whileTap={{ scale: 0.88, rotate: 20 }}
                transition={springs.pop}
                onClick={() => {
                  setNames((n) => ({ ...n, [species]: pick(info.names, n[species]) }))
                  setError(null)
                }}
                className={`grid size-12 shrink-0 place-items-center rounded-[var(--radius-chip)] ${tone.chip} ${tone.ink} shadow-[var(--shadow-base)]`}
              >
                <Icon name="dice" />
              </motion.button>
            </div>
            {error && (
              <p id="pet-name-error" role="alert" className="text-sm font-bold text-berry">
                {error}
              </p>
            )}
            <motion.button
              type="submit"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96, y: 1 }}
              transition={springs.pop}
              className="mt-1 min-h-14 rounded-full bg-berry px-6 font-display text-lg text-milk shadow-[0_2px_0_var(--color-berry-deep),0_12px_24px_-10px_rgb(176_67_108/0.6)] hover:bg-berry-deep"
            >
              Bring {displayName} home
            </motion.button>
          </form>
        </section>
      </div>
    </div>
  )
}

function StageArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={side === 'left' ? 'Previous pet' : 'Next pet'}
      onClick={onClick}
      whileHover={{ scale: 1.08, x: side === 'left' ? -2 : 2 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.pop}
      className={`absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-milk/90 text-cocoa shadow-[var(--shadow-raised)] ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      <Icon name={side === 'left' ? 'chevronLeft' : 'chevronRight'} />
    </motion.button>
  )
}
