import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CoinChip } from '../components/CoinChip'
import { STAT_LABEL } from '../components/FoodTray'
import { Icon, type IconName } from '../components/Icon'
import { Burst } from '../components/Particles'
import { springs } from '../components/tones'
import { useGame } from '../game/GameContext'
import { BASIC_FOODS, FOODS, type FoodId } from '../game/items'
import { walkChatter, walkEventLine } from '../game/messages'
import { SPECIES } from '../game/pets'
import { STAT_KEYS, type PetState, type RouteId, type StatKey, type WalkEventKind } from '../game/state'
import type { PetMood } from '../game/types'
import { canWalk, ROUTE_ORDER, ROUTES, WALK_EVENTS, walkProgress } from '../game/walk'
import { INK } from '../pets/parts'
import { PetSprite } from '../pets/PetSprite'
import { ParkScene } from './ParkScene'
import { playSfx, WALK_SFX } from '../lib/sound'

/** Where walkers stand on the path (centre x, %), leader first and furthest along. */
const LINEUP: Record<number, { xs: number[]; width: string }> = {
  1: { xs: [50], width: 'min(36%, 15rem)' },
  2: { xs: [60, 34], width: 'min(30%, 12rem)' },
  3: { xs: [66, 44, 22], width: 'min(25%, 10rem)' },
  4: { xs: [70, 51, 32, 13], width: 'min(21%, 8.5rem)' },
}

const EVENT_ICON: Record<WalkEventKind, IconName> = {
  acorn: 'coin',
  snack: 'cookie',
  friend: 'heart',
  butterfly: 'sparkle',
  bench: 'bolt',
  flowers: 'leaf',
  puddle: 'sparkle',
}
const EVENT_WEIGHTS: [WalkEventKind, number][] = [
  ['acorn', 3],
  ['snack', 2],
  ['friend', 2],
  ['butterfly', 2],
  ['bench', 1],
  ['flowers', 2],
  ['puddle', 3],
]

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Toast = { id: number; kind: WalkEventKind; title: string; detail: string }

export function WalkScreen({ onDone }: { onDone: () => void }) {
  const { state, startWalk, walkEvent, finishWalk, closeWalk } = useGame()
  const walk = state.walk
  const [selected, setSelected] = useState<string[]>(() => (canWalk(state, state.activeId) === 'ok' ? [state.activeId] : []))
  const [route, setRoute] = useState<RouteId>('stroll')
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState<Toast | null>(null)
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null)
  const [excitedUntil, setExcitedUntil] = useState(0)
  const nextEventAt = useRef(0)
  const finishing = useRef(false)
  const seq = useRef(0)

  const walking = !!walk && !walk.summary
  const walkerIds = walk ? walk.petIds : selected
  const walkers = walkerIds.map((id) => state.pets.find((p) => p.id === id)).filter((p): p is PetState => !!p)
  const names = walkers.map((p) => p.name)
  const progress = walkProgress(state, now)

  // Clock for the walk: progress, random events, chatter and arrival.
  useEffect(() => {
    if (!walking || !walk) return
    finishing.current = false
    nextEventAt.current = walk.startedAt + rand(6000, 9000)
    let nextChatter = Date.now() + rand(4000, 6000)
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      const route = ROUTES[walk.route]
      if (t - walk.startedAt >= route.durationMs) {
        if (!finishing.current) {
          finishing.current = true
          finishWalk()
        }
        return
      }
      if (t >= nextEventAt.current) {
        nextEventAt.current = t + rand(7000, 11000)
        rollEvent()
      } else if (t >= nextChatter) {
        nextChatter = t + rand(8000, 12000)
        setBubble({ text: walkChatter(), id: ++seq.current })
      }
    }, 250)
    return () => clearInterval(id)
    // rollEvent reads the latest walk through stateRef, so only a new walk restarts the clock.
  }, [walking, walk?.startedAt])

  const stateRef = useRef(state)
  stateRef.current = state
  function rollEvent() {
    const w = stateRef.current.walk
    if (!w || w.summary || w.found.events.length >= ROUTES[w.route].maxEvents) return
    const group = w.petIds.length > 1
    const pool = EVENT_WEIGHTS.filter(([k]) => group || !WALK_EVENTS[k].groupOnly)
    let roll = Math.random() * pool.reduce((a, [, wt]) => a + wt, 0)
    const kind = pool.find(([, wt]) => (roll -= wt) < 0)?.[0] ?? 'acorn'
    const food: FoodId | undefined = kind === 'snack' ? BASIC_FOODS[Math.floor(Math.random() * BASIC_FOODS.length)] : undefined
    walkEvent(kind, food)
    playSfx(WALK_SFX[kind])
    const walkerNames = w.petIds.map((id) => stateRef.current.pets.find((p) => p.id === id)?.name ?? '')
    setToast({ id: ++seq.current, kind, ...walkEventLine(kind, walkerNames, food) })
    setExcitedUntil(Date.now() + 1400)
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3400)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), 2800)
    return () => clearTimeout(t)
  }, [bubble])

  const begin = () => {
    if (selected.length === 0) return
    startWalk(selected, route)
    setNow(Date.now())
    setBubble({ text: selected.length > 1 ? 'Let’s go, everyone!' : 'Walkies!', id: ++seq.current })
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const moodFor = (i: number): PetMood => {
    if (walk?.summary) return 'happy'
    if (!walking) return 'idle'
    if (i === 0 && now < excitedUntil) return 'excited'
    return 'walking'
  }

  const lineup = LINEUP[Math.max(1, walkers.length)]!
  const routeInfo = ROUTES[walk?.route ?? route]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6 lg:pb-32">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl">
          <Icon name="paw" size={26} className="text-berry" />
          {walking ? routeInfo.name : 'Walk in the park'}
        </h1>
        <CoinChip coins={state.coins} />
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="relative">
          <ParkScene
            moving={walking}
            compact={!walk}
            label={walking ? `Walking the ${routeInfo.name}` : 'The park'}
            overlay={toast && <EventVisual key={toast.id} kind={toast.kind} />}
          >
            <AnimatePresence>
              {walkers.map((p, i) => (
                <motion.div
                  key={p.id}
                  className="absolute"
                  style={{ left: `${lineup.xs[i]}%`, width: lineup.width, translate: '-50% 0', bottom: i % 2 ? '3%' : '0%' }}
                  initial={{ opacity: 0, y: 30, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.6 }}
                  transition={springs.pop}
                  layout
                >
                  <PetSprite species={p.species} mood={moodFor(i)} accessory={p.accessory} label={`${p.name} the ${SPECIES[p.species].kind.toLowerCase()}`} className="w-full" />
                </motion.div>
              ))}
            </AnimatePresence>
            {toast && toast.kind !== 'friend' && toast.kind !== 'butterfly' && toast.kind !== 'puddle' && (
              <Burst key={`b-${toast.id}`} kind="sparkles" x={`${lineup.xs[0]}%`} y="10%" />
            )}
          </ParkScene>

          {/* Event card and chatter sit over the top of the scene */}
          <div className="pointer-events-none absolute inset-x-0 top-5 flex flex-col items-center gap-2 px-6" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {toast ? (
                <motion.div
                  key={`t-${toast.id}`}
                  className="sticker flex max-w-[min(90%,24rem)] items-center gap-3 px-4 py-2"
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={springs.pop}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-soft text-berry">
                    <Icon name={EVENT_ICON[toast.kind]} size={20} />
                  </span>
                  <span className="text-sm leading-snug">
                    <strong className="block">{toast.title}</strong>
                    <span className="text-cocoa-soft">{toast.detail}</span>
                  </span>
                </motion.div>
              ) : (
                bubble && (
                  <motion.p
                    key={`c-${bubble.id}`}
                    className="sticker px-4 py-2 text-sm font-bold"
                    initial={{ opacity: 0, y: 8, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={springs.pop}
                  >
                    {bubble.text}
                  </motion.p>
                )
              )}
            </AnimatePresence>
          </div>
        </div>

        <section className="sticker stitch flex flex-col gap-4 p-4 sm:p-6" aria-label="Walk">
          {walk?.summary ? (
            <Results
              onDone={() => {
                closeWalk()
                onDone()
              }}
            />
          ) : walking && walk ? (
            <>
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-lg">On the way</h2>
                  <span className="text-sm tabular-nums text-cocoa-soft">
                    {fmt(now - walk.startedAt)} of {fmt(routeInfo.durationMs)}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Walk progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                  className="relative h-3 rounded-full bg-mint-soft"
                >
                  <motion.div className="h-full w-full origin-left rounded-full bg-mint" style={{ scaleX: progress }} />
                  {/* The wrapper spans the track, so translating it by n% moves the marker n% along */}
                  <div className="pointer-events-none absolute inset-0" style={{ transform: `translateX(${progress * 100}%)` }}>
                    <span className="absolute left-0 top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-milk text-berry shadow-[var(--shadow-raised)]">
                      <Icon name="paw" size={16} />
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-body text-sm font-bold text-cocoa-soft">Found along the way</h3>
                {walk.found.events.length === 0 ? (
                  <p className="text-sm text-cocoa-soft">Nothing yet. Keep walking!</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {walk.found.events.map((kind, i) => (
                      <motion.li
                        key={i}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={springs.pop}
                        className="flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-base)]"
                      >
                        <Icon name={EVENT_ICON[kind]} size={14} />
                        {kind[0]!.toUpperCase() + kind.slice(1)}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
              <motion.button
                type="button"
                onClick={() => {
                  finishing.current = true
                  finishWalk()
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={springs.pop}
                className="min-h-12 rounded-full border-2 border-cocoa/15 bg-cream px-5 font-bold"
              >
                Head home now
              </motion.button>
              <p className="-mt-2 text-center text-xs text-cocoa-soft">Heading home early gives part of the rewards.</p>
            </>
          ) : (
            <Planner
              selected={selected}
              onToggle={toggle}
              route={route}
              onRoute={setRoute}
              onStart={begin}
              names={names}
            />
          )}
        </section>
      </main>
    </div>
  )
}

function Planner({
  selected,
  onToggle,
  route,
  onRoute,
  onStart,
  names,
}: {
  selected: string[]
  onToggle: (id: string) => void
  route: RouteId
  onRoute: (r: RouteId) => void
  onStart: () => void
  names: string[]
}) {
  const { state } = useGame()
  return (
    <>
      <div>
        <h2 className="mb-1 text-lg">Who&rsquo;s coming?</h2>
        <p className="mb-3 text-sm text-cocoa-soft">Walking together grows friendship.</p>
        <div role="group" aria-label="Choose walkers" className="grid grid-cols-2 gap-2">
          {state.pets.map((p) => {
            const status = canWalk(state, p.id)
            const on = selected.includes(p.id)
            return (
              <motion.button
                key={p.id}
                type="button"
                aria-pressed={on}
                disabled={status !== 'ok'}
                onClick={() => onToggle(p.id)}
                whileHover={status === 'ok' ? { y: -2 } : undefined}
                whileTap={status === 'ok' ? { scale: 0.95 } : undefined}
                transition={springs.pop}
                className={`flex min-h-14 items-center gap-2 rounded-[var(--radius-chip)] border-2 p-1.5 pr-2 text-left disabled:cursor-not-allowed disabled:opacity-55 ${
                  on ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream'
                }`}
              >
                <PetSprite species={p.species} mood={p.sleeping ? 'sleeping' : 'idle'} label="" className="w-10 shrink-0" />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="text-xs text-cocoa-soft">{status === 'asleep' ? 'Sleeping' : status === 'tired' ? 'Too tired' : on ? 'Coming along' : 'Tap to bring'}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg">Pick a route</h2>
        <div role="radiogroup" aria-label="Route" className="flex flex-col gap-2">
          {ROUTE_ORDER.map((id) => {
            const r = ROUTES[id]
            const on = id === route
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onRoute(id)}
                className={`flex items-center justify-between gap-3 rounded-[var(--radius-chip)] border-2 px-3 py-2 text-left active:scale-[0.98] ${
                  on ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream hover:border-cocoa/25'
                }`}
              >
                <span className="leading-snug">
                  <span className="block font-bold">{r.name}</span>
                  <span className="text-xs text-cocoa-soft">{r.blurb}</span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-cocoa-soft">{fmt(r.durationMs)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        disabled={selected.length === 0}
        whileHover={selected.length ? { y: -3 } : undefined}
        whileTap={selected.length ? { scale: 0.96 } : undefined}
        transition={springs.pop}
        className="sticky bottom-[6.5rem] z-10 min-h-14 rounded-full bg-berry px-6 font-display text-lg text-milk shadow-[0_2px_0_var(--color-berry-deep),0_12px_24px_-10px_rgb(176_67_108/0.6)] hover:bg-berry-deep disabled:cursor-not-allowed disabled:opacity-50 lg:static"
      >
        {selected.length === 0 ? 'Pick someone to walk' : selected.length === 1 ? `Walk with ${names[0]}` : `Walk with ${selected.length} pets`}
      </motion.button>
    </>
  )
}

function Results({ onDone }: { onDone: () => void }) {
  const { state } = useGame()
  const walk = state.walk!
  const s = walk.summary!
  const nameOf = (id: string) => state.pets.find((p) => p.id === id)?.name ?? ''
  const early = s.completed < 0.999
  const items = Object.entries(s.items) as [FoodId, number][]

  return (
    <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.settle}>
      <div>
        <h2 className="text-2xl">{early ? 'Home a little early' : 'What a walk!'}</h2>
        <p className="text-sm text-cocoa-soft">
          {early ? `Walked ${Math.round(s.completed * 100)}% of the ${ROUTES[walk.route].name}.` : `Finished the whole ${ROUTES[walk.route].name}.`}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {s.perPet.map((row) => {
          const pet = state.pets.find((p) => p.id === row.petId)
          if (!pet) return null
          return (
            <li key={row.petId} className="flex items-center gap-2 rounded-[var(--radius-chip)] bg-cream p-2">
              <PetSprite species={pet.species} mood="happy" label="" className="w-10 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {pet.name}
                  {row.levelUp && <span className="ml-2 rounded-full bg-lavender-soft px-2 py-0.5 text-xs text-[#6a55a8]">Level {row.levelUp}!</span>}
                </p>
                <p className="flex flex-wrap gap-x-2 text-xs">
                  {STAT_KEYS.filter((k) => row.deltas[k]).map((k: StatKey) => (
                    <span key={k} className={row.deltas[k]! > 0 ? 'text-[#2f7a57]' : 'text-berry'}>
                      {row.deltas[k]! > 0 ? '+' : ''}
                      {row.deltas[k]} {STAT_LABEL[k]}
                    </span>
                  ))}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap gap-2 text-sm font-bold">
        {s.coins > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-peach-soft px-3 py-1 text-[#b5602b]">
            <Icon name="coin" size={16} />+{s.coins} {s.coins === 1 ? 'coin' : 'coins'}
          </span>
        )}
        <span className="rounded-full bg-lavender-soft px-3 py-1 text-[#6a55a8]">+{s.xp} XP each</span>
        {items.map(([food, n]) => (
          <span key={food} className="flex items-center gap-1 rounded-full bg-mint-soft px-3 py-1 text-[#2f7a57]">
            <Icon name={FOODS[food].icon} size={16} />+{n} {FOODS[food].name}
          </span>
        ))}
      </div>

      {s.friendship.length > 0 && (
        <div>
          <h3 className="mb-1 font-body text-sm font-bold text-cocoa-soft">Friendship</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {s.friendship.map((f) => (
              <li key={`${f.a}-${f.b}`} className="flex items-center gap-2">
                <Icon name="heart" size={16} className="text-berry" />
                {nameOf(f.a)} and {nameOf(f.b)}
                <span className="ml-auto font-bold text-[#2f7a57]">+{f.gain}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <motion.button
        type="button"
        onClick={onDone}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.96 }}
        transition={springs.pop}
        className="min-h-14 rounded-full bg-berry px-6 font-display text-lg text-milk shadow-[0_2px_0_var(--color-berry-deep),0_12px_24px_-10px_rgb(176_67_108/0.6)] hover:bg-berry-deep"
      >
        Back home
      </motion.button>
    </motion.div>
  )
}

/** Visitors and sights that pass through the scene for some events. */
function EventVisual({ kind }: { kind: WalkEventKind }) {
  const stroke = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
  if (kind === 'friend') {
    return (
      <motion.div
        className="pointer-events-none absolute bottom-[9%] left-full z-10 w-[min(14%,4.5rem)]"
        initial={{ x: 0 }}
        animate={{ x: '-900%' }}
        transition={{ duration: 6, ease: 'linear' }}
        aria-hidden="true"
      >
        <motion.svg viewBox="0 0 60 50" className="w-full overflow-visible" animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 0.4, repeat: Infinity }}>
          <ellipse cx={30} cy={34} rx={20} ry={13} fill="#fffdf9" {...stroke} />
          <circle cx={18} cy={18} r={10} fill="#fffdf9" {...stroke} />
          <path d="M8 18 0 21 8 23Z" fill="#ffc46b" {...stroke} strokeWidth={2} />
          <circle cx={15} cy={16} r={1.8} fill={INK} />
          <path d="M40 30c6-2 10 0 12-4" fill="none" {...stroke} strokeWidth={2.5} />
        </motion.svg>
      </motion.div>
    )
  }
  if (kind === 'butterfly') {
    return (
      <motion.div
        className="pointer-events-none absolute left-full top-[30%] z-10 w-10"
        initial={{ x: 0, y: 0 }}
        animate={{ x: '-1400%', y: [0, -30, 10, -20, 0] }}
        transition={{ duration: 5, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <motion.svg viewBox="0 0 40 30" className="w-full overflow-visible" animate={{ scaleX: [1, 0.3, 1] }} transition={{ duration: 0.25, repeat: Infinity }}>
          <path d="M20 15C10 0 0 4 4 14c-4 8 8 12 16 1Z" fill="#cfc3f0" {...stroke} strokeWidth={2} />
          <path d="M20 15C30 0 40 4 36 14c4 8-8 12-16 1Z" fill="#f6b8c6" {...stroke} strokeWidth={2} />
        </motion.svg>
      </motion.div>
    )
  }
  if (kind === 'puddle') {
    return (
      <>
        <motion.div
          className="pointer-events-none absolute bottom-[4%] left-full h-[7%] w-[22%] rounded-[50%] border-[3px] border-cocoa/60 bg-[#bfe3f2]"
          initial={{ x: 0 }}
          animate={{ x: '-560%' }}
          transition={{ duration: 6.5, ease: 'linear' }}
          aria-hidden="true"
        />
        <Burst kind="sparkles" x="50%" y="80%" />
      </>
    )
  }
  return null
}
