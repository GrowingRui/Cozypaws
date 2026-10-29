import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, LayoutGroup, motion, useAnimate } from 'motion/react'
import { ActionButton } from '../components/ActionButton'
import { FoodTray, STAT_LABEL } from '../components/FoodTray'
import { Icon, type IconName } from '../components/Icon'
import { NavBar, type Tab } from '../components/NavBar'
import { Burst, type BurstKind } from '../components/Particles'
import { PetSwitcher } from '../components/PetSwitcher'
import { StatBar } from '../components/StatBar'
import { springs, type Tone } from '../components/tones'
import { useGame } from '../game/GameContext'
import type { FoodId } from '../game/items'
import { restingMood, xpToNext } from '../game/logic'
import { eventLine, idleLine } from '../game/messages'
import { SPECIES } from '../game/pets'
import { activePet, MAX_PETS, STAT_KEYS, type StatKey } from '../game/state'
import type { PetMood } from '../game/types'
import { PetSprite } from '../pets/PetSprite'
import { BallProp, FoodProp, PatProp, YarnProp } from './HomeProps'
import { Stage } from './Stage'

const STAT_STYLE: Record<StatKey, { icon: IconName; tone: Tone }> = {
  fullness: { icon: 'drumstick', tone: 'peach' },
  happiness: { icon: 'heart', tone: 'blush' },
  energy: { icon: 'bolt', tone: 'lavender' },
  health: { icon: 'leaf', tone: 'mint' },
  bond: { icon: 'sparkle', tone: 'berry' },
}

/** Where the other pets hang out in the room: left and right of the rug, and on the windowsill. */
const ROOM_SPOTS: CSSProperties[] = [
  { left: '4%', bottom: '24%', width: 'min(21%, 7.5rem)' },
  { right: '4%', bottom: '24%', width: 'min(21%, 7.5rem)' },
  { left: '21%', bottom: '55%', width: 'min(15%, 5rem)', translate: '-50% 0' },
]

type Reaction = { mood: PetMood; ms: number; id: number }
type PropShown = { kind: 'feed' | 'pet' | 'play' | 'fetch'; food?: FoodId; id: number }
type BurstShown = { kind: BurstKind; id: number; x: string; y: string }
type Bubble = { text: string; id: number }

const CHATTER_MS = 16_000
const BUBBLE_MS = 3200

type HomeScreenProps = {
  onAdopt: () => void
  /** Play the welcome for a pet that was adopted just before this screen opened. */
  welcome?: boolean
}

export function HomeScreen({ onAdopt, welcome = false }: HomeScreenProps) {
  const { state, feed, care, sleep, wake, switchPet } = useGame()
  const { event } = state
  const pet = activePet(state)
  const { stats, sleeping } = pet
  const others = state.pets.filter((p) => p.id !== pet.id)
  const info = SPECIES[pet.species]

  const [tab, setTab] = useState<Tab>('home')
  const [trayOpen, setTrayOpen] = useState(false)
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const [prop, setProp] = useState<PropShown | null>(null)
  const [bursts, setBursts] = useState<BurstShown[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [deltas, setDeltas] = useState<Partial<Record<StatKey, { value: number; id: number }>>>({})
  const [chips, setChips] = useState<{ id: number; items: [StatKey, number][] } | null>(null)
  const [petScope, animatePet] = useAnimate<HTMLButtonElement>()
  const feedButtonRef = useRef<HTMLButtonElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  // Only react to events that happen after this screen mounts (plus a fresh adoption's welcome).
  const seenEvent = useRef(welcome && event?.kind === 'adopt' ? event.id - 1 : (event?.id ?? 0))
  const petRef = useRef(pet)
  petRef.current = pet
  const bubbleSeq = useRef(0)
  const burstSeq = useRef(0)

  const say = useCallback((text: string) => setBubble({ text, id: ++bubbleSeq.current }), [])

  // React to each new game event. Every event has a fresh id, so repeats always replay.
  useEffect(() => {
    if (!event || event.id <= seenEvent.current) return
    seenEvent.current = event.id
    // Events for pets in the background (e.g. one waking up) don't take over the stage.
    if (event.petId !== petRef.current.id) return
    say(eventLine(event, petRef.current.species))

    const id = event.id
    const burst = (kind: BurstKind, x: string, y: string) => {
      const burstId = ++burstSeq.current
      setBursts((b) => [...b.slice(-3), { kind, id: burstId, x, y }])
    }

    switch (event.kind) {
      case 'feed':
        setReaction({ mood: 'eating', ms: 1900, id })
        setProp({ kind: 'feed', food: event.food, id })
        burst('crumbs', '55%', '62%')
        break
      case 'pet':
        setReaction({ mood: 'happy', ms: 1400, id })
        setProp({ kind: 'pet', id })
        burst('hearts', '50%', '22%')
        break
      case 'play':
        setReaction({ mood: 'excited', ms: 2000, id })
        setProp({ kind: 'play', id })
        burst('stars', '40%', '40%')
        break
      case 'fetch':
        setReaction({ mood: 'excited', ms: 1900, id })
        setProp({ kind: 'fetch', id })
        burst('sparkles', '50%', '30%')
        break
      case 'switch':
      case 'adopt':
        // A different pet takes the stage: clear the previous pet's reaction leftovers.
        setProp(null)
        setChips(null)
        setDeltas({})
        setReaction({ mood: event.kind === 'adopt' ? 'excited' : 'happy', ms: 1400, id })
        burst(event.kind === 'adopt' ? 'sparkles' : 'hearts', '50%', '22%')
        break
      case 'wake':
        setReaction({ mood: 'happy', ms: 1200, id })
        break
      case 'refuse':
        // A little head-shake says "no" without changing anything.
        animatePet(petScope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.45 })
        break
    }
    if (event.levelUp) burst('sparkles', '50%', '10%')

    const changed = STAT_KEYS.filter((k) => event.deltas[k]).map((k) => [k, event.deltas[k]!] as [StatKey, number])
    if (changed.length) {
      setDeltas((d) => ({ ...d, ...Object.fromEntries(changed.map(([k, v]) => [k, { value: v, id }])) }))
      setChips({ id, items: changed.slice(0, 3) })
    }
  }, [event, say, animatePet, petScope])

  useEffect(() => {
    if (!reaction) return
    const t = setTimeout(() => setReaction(null), reaction.ms)
    return () => clearTimeout(t)
  }, [reaction])

  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), BUBBLE_MS)
    return () => clearTimeout(t)
  }, [bubble])

  // Occasional unprompted chatter from whichever pet is on stage.
  const welcomeRef = useRef(welcome)
  useEffect(() => {
    // Open with a line, unless a newcomer's welcome is already being said.
    const first = welcomeRef.current ? null : idleLine(petRef.current)
    if (first) say(first)
    const id = setInterval(() => {
      const line = idleLine(petRef.current)
      if (line) say(line)
    }, CHATTER_MS)
    return () => clearInterval(id)
  }, [say])

  const closeTray = useCallback(() => {
    setTrayOpen(false)
    feedButtonRef.current?.focus()
  }, [])

  // Opening the tray pushes the action bar down; keep it clear of the fixed nav bar.
  useEffect(() => {
    if (!trayOpen) return
    const t = setTimeout(() => {
      const el = actionsRef.current
      if (!el) return
      const navTop = window.innerHeight - 96
      const bottom = el.getBoundingClientRect().bottom
      if (bottom > navTop) window.scrollBy({ top: bottom - navTop + 12, behavior: 'smooth' })
    }, 60)
    return () => clearTimeout(t)
  }, [trayOpen])

  // The food tray closes when the pet on stage falls asleep.
  useEffect(() => {
    if (sleeping) setTrayOpen(false)
  }, [sleeping])

  const mood = reaction?.mood ?? restingMood(pet)
  const foodCount = Object.values(state.inventory).reduce((a, b) => a + b, 0)
  const xpNeeded = xpToNext(pet.level)
  const justAdopted = welcome && event?.kind === 'adopt' && event.petId === pet.id

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6 lg:pb-32">
      <header className="flex items-center justify-between gap-3">
        <PetSwitcher pets={state.pets} activeId={pet.id} onSwitch={switchPet} onAdopt={onAdopt} canAdopt={state.pets.length < MAX_PETS} />
        <motion.div
          key={state.coins}
          className="sticker flex shrink-0 items-center gap-1.5 px-3 py-2 font-bold text-[#b5602b]"
          aria-label={`${state.coins} coins`}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.35 }}
        >
          <Icon name="coin" size={20} />
          <span className="tabular-nums text-cocoa">{state.coins}</span>
        </motion.div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <LayoutGroup>
            <div className="relative">
              <Stage
                label={`${pet.name}'s room`}
                night={sleeping}
                scenery={others.map((other, i) => (
                  <motion.button
                    key={other.id}
                    layoutId={other.id}
                    type="button"
                    onClick={() => switchPet(other.id)}
                    aria-label={`Play with ${other.name}`}
                    title={other.name}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    transition={springs.settle}
                    className="absolute rounded-2xl"
                    style={ROOM_SPOTS[i]}
                  >
                    <PetSprite species={other.species} mood={restingMood(other)} accessory={other.accessory} label="" className="pointer-events-none w-full" />
                  </motion.button>
                ))}
              >
                <motion.div
                  key={pet.id}
                  layoutId={pet.id}
                  className="relative"
                  initial={justAdopted ? { scale: 0.4, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springs.settle}
                >
                  <motion.button
                    ref={petScope}
                    type="button"
                    onClick={() => (sleeping ? wake() : care('pet'))}
                    aria-label={sleeping ? `Wake ${pet.name}` : `Pet ${pet.name}`}
                    whileTap={{ scale: 0.95 }}
                    className="block rounded-[2rem] outline-offset-4"
                  >
                    <PetSprite
                      species={pet.species}
                      mood={mood}
                      accessory={pet.accessory}
                      label=""
                      className="pointer-events-none w-[min(50vw,14rem)] lg:w-[16rem]"
                    />
                  </motion.button>

                  {prop?.kind === 'feed' && prop.food && <FoodProp key={`prop-${prop.id}`} food={prop.food} />}
                  {prop?.kind === 'pet' && <PatProp key={`prop-${prop.id}`} />}
                  {prop?.kind === 'play' && <YarnProp key={`prop-${prop.id}`} />}
                  {prop?.kind === 'fetch' && <BallProp key={`prop-${prop.id}`} />}
                  {bursts.map((b) => (
                    <Burst key={`burst-${b.id}`} kind={b.kind} x={b.x} y={b.y} />
                  ))}

                  {/* Stat changes float up beside the pet, so feedback is visible without scrolling */}
                  {chips && (
                    <div
                      key={`chips-${chips.id}`}
                      className="pointer-events-none absolute -right-[14%] top-[6%] flex flex-col items-start gap-1"
                      aria-hidden="true"
                    >
                      {chips.items.map(([k, v], i) => (
                        <motion.span
                          key={k}
                          className={`flex items-center gap-1 rounded-full bg-milk/95 px-2 py-0.5 text-xs font-bold shadow-[var(--shadow-raised)] ${
                            v > 0 ? 'text-[#2f7a57]' : 'text-berry'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, -4, -16] }}
                          transition={{ duration: 1.9, delay: i * 0.08, times: [0, 0.15, 0.75, 1] }}
                        >
                          <Icon name={STAT_STYLE[k].icon} size={14} />
                          {v > 0 ? '+' : ''}
                          {v}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </Stage>

              {/* Nameplate for the pet on stage */}
              <div className="sticker absolute bottom-5 left-5 z-10 max-w-[38%] px-3 py-2 sm:bottom-6 sm:left-6 sm:max-w-[55%] sm:px-4">
                <h1 className="truncate text-lg leading-tight sm:text-2xl">{pet.name}</h1>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <motion.p
                    key={`${pet.id}-${pet.level}`}
                    className="whitespace-nowrap text-xs font-bold text-cocoa-soft sm:text-sm"
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={springs.pop}
                  >
                    Level {pet.level} {info.kind.toLowerCase()}
                  </motion.p>
                  <div
                    role="progressbar"
                    aria-label={`${pet.name}'s experience to next level`}
                    aria-valuemin={0}
                    aria-valuemax={xpNeeded}
                    aria-valuenow={pet.xp}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-lavender-soft sm:w-16"
                  >
                    <motion.div
                      className="h-full w-full origin-left rounded-full bg-lavender"
                      initial={false}
                      animate={{ scaleX: pet.xp / xpNeeded }}
                      transition={springs.settle}
                    />
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-5 flex justify-center px-6" aria-live="polite">
                <AnimatePresence mode="popLayout">
                  {bubble && (
                    <motion.p
                      key={bubble.id}
                      className="sticker relative max-w-[min(80%,22rem)] px-4 py-2 text-center text-sm font-bold"
                      initial={{ opacity: 0, y: 8, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={springs.pop}
                    >
                      {bubble.text}
                      <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-sm bg-milk" />
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </LayoutGroup>

          <AnimatePresence>
            {trayOpen && <FoodTray id="food-tray" inventory={state.inventory} onPick={feed} onClose={closeTray} />}
          </AnimatePresence>

          <div ref={actionsRef} role="group" aria-label="Care actions" className="grid grid-cols-5 gap-2 sm:gap-3">
            <ActionButton
              ref={feedButtonRef}
              icon="bowl"
              label="Feed"
              tone="peach"
              badge={foodCount}
              disabled={sleeping}
              expanded={trayOpen}
              controls="food-tray"
              onClick={() => setTrayOpen((o) => !o)}
            />
            <ActionButton icon="hand" label="Pet" tone="blush" disabled={sleeping} onClick={() => care('pet')} />
            <ActionButton icon="yarn" label="Play" tone="lavender" disabled={sleeping} onClick={() => care('play')} />
            <ActionButton icon="ball" label="Ball" tone="mint" disabled={sleeping} onClick={() => care('fetch')} />
            {sleeping ? (
              <ActionButton icon="sun" label="Wake" tone="peach" onClick={wake} />
            ) : (
              <ActionButton icon="moon" label="Sleep" tone="lavender" onClick={sleep} />
            )}
          </div>
        </div>

        <aside aria-label={`How ${pet.name} is doing`} className="sticker stitch p-4 sm:p-6">
          <h2 className="sr-only lg:not-sr-only lg:mb-3 lg:text-lg">How {pet.name} feels</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-3">
            {STAT_KEYS.map((k) => (
              <StatBar key={k} label={STAT_LABEL[k]} icon={STAT_STYLE[k].icon} tone={STAT_STYLE[k].tone} value={stats[k]} delta={deltas[k]} />
            ))}
          </div>
          {sleeping && <p className="mt-3 text-sm font-bold text-cocoa-soft">{pet.name} is sleeping. Energy is coming back.</p>}
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <NavBar active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
