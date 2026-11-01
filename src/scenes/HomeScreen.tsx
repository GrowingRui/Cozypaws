import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, LayoutGroup, motion, useAnimate } from 'motion/react'
import { ActionButton } from '../components/ActionButton'
import { PlayTray, TogetherTray } from '../components/CareTrays'
import { CoinChip } from '../components/CoinChip'
import { DailyGoals } from '../components/DailyGoals'
import { FoodTray, STAT_LABEL } from '../components/FoodTray'
import { FriendsList } from '../components/FriendsList'
import { GameMenu } from '../components/GameMenu'
import { Icon, type IconName } from '../components/Icon'
import { Burst, type BurstKind } from '../components/Particles'
import { PetSwitcher } from '../components/PetSwitcher'
import { StatBar } from '../components/StatBar'
import { springs, type Tone } from '../components/tones'
import { useGame } from '../game/GameContext'
import { useBackLayer } from '../lib/backStack'
import type { FoodId } from '../game/items'
import { restingMood, xpToNext } from '../game/logic'
import { eventLine, greetingLine, idleLine } from '../game/messages'
import { SPECIES } from '../game/pets'
import { activePet, MAX_PETS, STAT_KEYS, type GameState, type PetState, type StatKey, type TogetherGame } from '../game/state'
import { friendLevel, friendshipOf } from '../game/together'
import type { PetMood } from '../game/types'
import { PetSprite } from '../pets/PetSprite'
import { BallProp, BubblesProp, CatchProp, FeatherProp, FoodProp, MiniBowl, PatProp, TugProp, YarnProp } from './HomeProps'
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
/** When everyone naps together, sleeping pets gather around the one on stage. */
const CUDDLE_SPOTS: CSSProperties[] = [
  { left: '10%', bottom: '9%', width: 'min(26%, 9rem)' },
  { right: '10%', bottom: '9%', width: 'min(26%, 9rem)' },
  { left: '2%', bottom: '4%', width: 'min(20%, 7rem)' },
]

type Reaction = { mood: PetMood; ms: number; id: number }
type PropShown = { kind: 'feed' | 'pet' | 'play' | 'fetch' | 'feather' | 'bubbles'; food?: FoodId; id: number }
type BurstShown = { kind: BurstKind; id: number; x: string; y: string }
type Bubble = { text: string; id: number }
type Tray = 'food' | 'play' | 'together' | null
/** Temporary look for a pet in the room (greeting, dinner), with an optional heart burst. */
type RoomFx = { mood: PetMood; until: number; burst?: number; bowl?: boolean }

const CHATTER_MS = 16_000
const BUBBLE_MS = 3200
const SOCIAL_MIN_MS = 20_000
const SOCIAL_MAX_MS = 30_000
const TOGETHER_MS = 2500

type HomeScreenProps = {
  onAdopt: () => void
  /** Wipe the save and go back to choosing a first pet. */
  onNewGame: () => void
  /** Replace the household with one from a save code. */
  onLoadSave: (state: GameState) => void
  /** Play the welcome for a pet that was adopted just before this screen opened. */
  welcome?: boolean
}

export function HomeScreen({ onAdopt, onNewGame, onLoadSave, welcome = false }: HomeScreenProps) {
  const { state, feed, care, sleep, wake, switchPet, playTogether, napTogether, dinner, socialize, claimGoal } = useGame()
  const { event } = state
  const pet = activePet(state)
  const { stats, sleeping } = pet
  const others = state.pets.filter((p) => p.id !== pet.id)
  const info = SPECIES[pet.species]

  const [tray, setTray] = useState<Tray>(null)
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const [prop, setProp] = useState<PropShown | null>(null)
  const [bursts, setBursts] = useState<BurstShown[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [deltas, setDeltas] = useState<Partial<Record<StatKey, { value: number; id: number }>>>({})
  const [chips, setChips] = useState<{ id: number; items: [StatKey, number][] } | null>(null)
  const [buddyStage, setBuddyStage] = useState<{ id: string; game: TogetherGame; key: number } | null>(null)
  const [roomFx, setRoomFx] = useState<Record<string, RoomFx>>({})
  const [, setClock] = useState(0)
  const [petScope, animatePet] = useAnimate<HTMLButtonElement>()
  const trayButtons = useRef<Partial<Record<Exclude<Tray, null>, HTMLButtonElement | null>>>({})
  const actionsRef = useRef<HTMLDivElement>(null)
  // Only react to events that happen after this screen mounts (plus a fresh adoption's welcome).
  const seenEvent = useRef(welcome && event?.kind === 'adopt' ? event.id - 1 : (event?.id ?? 0))
  const stateRef = useRef(state)
  stateRef.current = state
  const petRef = useRef(pet)
  petRef.current = pet
  const bubbleSeq = useRef(0)
  const burstSeq = useRef(0)

  const say = useCallback((text: string) => setBubble({ text, id: ++bubbleSeq.current }), [])
  const burst = useCallback((kind: BurstKind, x: string, y: string) => {
    const id = ++burstSeq.current
    setBursts((b) => [...b.slice(-3), { kind, id, x, y }])
  }, [])
  const fx = useCallback((ids: string[], look: Omit<RoomFx, 'until'>, ms: number) => {
    const until = Date.now() + ms
    setRoomFx((cur) => ({ ...cur, ...Object.fromEntries(ids.map((id) => [id, { ...look, until }])) }))
    setTimeout(() => setClock((c) => c + 1), ms + 30)
  }, [])

  // React to each new game event. Every event has a fresh id, so repeats always replay.
  useEffect(() => {
    if (!event || event.id <= seenEvent.current) return
    seenEvent.current = event.id
    // Events for pets in the background (e.g. one waking up) don't take over the stage.
    if (event.petId !== petRef.current.id) return
    const names = (id: string) => stateRef.current.pets.find((p) => p.id === id)?.name ?? 'friend'
    say(eventLine(event, petRef.current.species, names))
    const id = event.id

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
      case 'feather':
      case 'bubbles':
        setReaction({ mood: 'excited', ms: 2000, id })
        setProp({ kind: event.kind, id })
        burst(event.kind === 'bubbles' ? 'sparkles' : 'stars', '50%', '25%')
        break
      case 'together':
        // The buddy joins on stage for the game, then wanders back to their spot.
        setProp(null)
        setBuddyStage({ id: event.buddyId!, game: event.game!, key: id })
        setReaction({ mood: 'excited', ms: TOGETHER_MS, id })
        burst('hearts', '50%', '18%')
        break
      case 'dinner': {
        const diners = event.petIds ?? []
        if (diners.includes(petRef.current.id)) {
          setReaction({ mood: 'eating', ms: 1900, id })
          setProp({ kind: 'feed', food: 'kibble', id })
        }
        fx(diners.filter((d) => d !== petRef.current.id), { mood: 'eating', bowl: true }, 2000)
        burst('crumbs', '55%', '62%')
        break
      }
      case 'switch':
      case 'adopt':
        // A different pet takes the stage: clear the previous pet's reaction leftovers.
        setProp(null)
        setChips(null)
        setDeltas({})
        setBuddyStage(null)
        setReaction({ mood: event.kind === 'adopt' ? 'excited' : 'happy', ms: 1400, id })
        burst(event.kind === 'adopt' ? 'sparkles' : 'hearts', '50%', '22%')
        break
      case 'wake':
        setReaction({ mood: 'happy', ms: 1200, id })
        break
      case 'goal':
        setReaction({ mood: 'excited', ms: 1600, id })
        burst('sparkles', '50%', '20%')
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
  }, [event, say, burst, fx, animatePet, petScope])

  useEffect(() => {
    if (!reaction) return
    const t = setTimeout(() => setReaction(null), reaction.ms)
    return () => clearTimeout(t)
  }, [reaction])

  useEffect(() => {
    if (!buddyStage) return
    const t = setTimeout(() => setBuddyStage(null), TOGETHER_MS)
    return () => clearTimeout(t)
  }, [buddyStage])

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

  // Now and then, two awake pets meet up on their own and grow a little closer.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        const s = stateRef.current
        const awake = s.pets.filter((p) => !p.sleeping)
        if (awake.length >= 2) {
          const a = awake[Math.floor(Math.random() * awake.length)]!
          const rest = awake.filter((p) => p.id !== a.id)
          const b = rest[Math.floor(Math.random() * rest.length)]!
          socialize(a.id, b.id)
          const lead = petRef.current.id
          const roomIds = [a.id, b.id].filter((x) => x !== lead)
          fx(roomIds, { mood: 'happy', burst: Date.now() }, 1600)
          if (a.id === lead || b.id === lead) {
            const friend = a.id === lead ? b : a
            say(greetingLine(friend.name, friendLevel(friendshipOf(s, lead, friend.id)).tier === 3))
            setReaction({ mood: 'happy', ms: 1300, id: -Date.now() })
            burst('hearts', '50%', '22%')
          }
        }
        schedule()
      }, SOCIAL_MIN_MS + Math.random() * (SOCIAL_MAX_MS - SOCIAL_MIN_MS))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [socialize, fx, say, burst])

  const closeTray = useCallback(() => {
    setTray((open) => {
      if (open) trayButtons.current[open]?.focus()
      return null
    })
  }, [])

  // Opening a tray pushes the action bar down; keep it clear of the fixed nav bar.
  useEffect(() => {
    if (!tray) return
    const t = setTimeout(() => {
      const el = actionsRef.current
      if (!el) return
      const navTop = window.innerHeight - 96
      const bottom = el.getBoundingClientRect().bottom
      if (bottom > navTop) window.scrollBy({ top: bottom - navTop + 12, behavior: 'smooth' })
    }, 60)
    return () => clearTimeout(t)
  }, [tray])

  // Back closes an open tray before it leaves Home.
  useBackLayer(tray !== null, closeTray)

  // Trays close when the pet on stage falls asleep.
  useEffect(() => {
    if (sleeping) setTray(null)
  }, [sleeping])

  const now = Date.now()
  const mood = reaction?.mood ?? restingMood(pet)
  const foodCount = Object.values(state.inventory).reduce((a, b) => a + b, 0)
  const xpNeeded = xpToNext(pet.level)
  const justAdopted = welcome && event?.kind === 'adopt' && event.petId === pet.id
  const buddy = buddyStage ? others.find((p) => p.id === buddyStage.id) : undefined
  const roomMood = (p: PetState): PetMood => {
    const f = roomFx[p.id]
    return f && f.until > now && !p.sleeping ? f.mood : restingMood(p)
  }
  const toggleTray = (t: Exclude<Tray, null>) => setTray((open) => (open === t ? null : t))
  const hasFriends = others.length > 0
  // Everyone asleep together: gather into a cuddle pile around the pet on stage.
  const cuddlePile = sleeping && others.some((o) => o.sleeping)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6 lg:pb-32">
      <header className="flex items-center justify-between gap-3">
        <PetSwitcher pets={state.pets} activeId={pet.id} onSwitch={switchPet} onAdopt={onAdopt} canAdopt={state.pets.length < MAX_PETS} />
        <div className="flex items-center gap-2">
          <CoinChip coins={state.coins} />
          <GameMenu onNewGame={onNewGame} onLoadSave={onLoadSave} />
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <LayoutGroup>
            <div className="relative">
              <Stage
                label={`${pet.name}'s room`}
                night={sleeping}
                scenery={others.map((other, i) => {
                  if (other.id === buddy?.id) return null
                  const cuddling = sleeping && other.sleeping
                  const f = roomFx[other.id]
                  const active = f && f.until > now
                  return (
                    <motion.button
                      key={other.id}
                      layoutId={other.id}
                      layout
                      type="button"
                      onClick={() => switchPet(other.id)}
                      aria-label={`Play with ${other.name}`}
                      title={other.name}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.92 }}
                      transition={springs.settle}
                      className="absolute rounded-2xl"
                      style={(cuddling ? CUDDLE_SPOTS : ROOM_SPOTS)[i]}
                    >
                      <PetSprite species={other.species} mood={roomMood(other)} accessory={other.accessory} label="" className="pointer-events-none w-full" />
                      {active && f.bowl && <MiniBowl key={`bowl-${f.until}`} />}
                      {active && f.burst && <Burst key={`fx-${f.burst}`} kind="hearts" x="50%" y="15%" />}
                    </motion.button>
                  )
                })}
              >
                <motion.div className="relative flex items-end gap-1" animate={buddy && buddyStage?.game === 'tug' ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }} transition={{ duration: 2.2 }}>
                  <motion.div
                    key={pet.id}
                    layoutId={pet.id}
                    className="relative"
                    initial={justAdopted ? { scale: 0.4, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1, rotate: buddy && buddyStage?.game === 'tug' ? -6 : 0 }}
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
                        className={`pointer-events-none ${buddy ? 'w-[min(34vw,12rem)]' : cuddlePile ? 'w-[min(38vw,12rem)]' : 'w-[min(50vw,14rem)] lg:w-[16rem]'}`}
                      />
                    </motion.button>

                    {prop?.kind === 'feed' && prop.food && <FoodProp key={`prop-${prop.id}`} food={prop.food} />}
                    {prop?.kind === 'pet' && <PatProp key={`prop-${prop.id}`} />}
                    {prop?.kind === 'play' && <YarnProp key={`prop-${prop.id}`} />}
                    {prop?.kind === 'fetch' && <BallProp key={`prop-${prop.id}`} />}
                    {prop?.kind === 'feather' && <FeatherProp key={`prop-${prop.id}`} />}
                    {prop?.kind === 'bubbles' && <BubblesProp key={`prop-${prop.id}`} />}
                    {!buddy &&
                      bursts.map((b) => <Burst key={`burst-${b.id}`} kind={b.kind} x={b.x} y={b.y} />)}

                    {/* Stat changes float up beside the pet, so feedback is visible without scrolling */}
                    {chips && !buddy && (
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

                  {buddy && buddyStage && (
                    <motion.div
                      key={buddy.id}
                      layoutId={buddy.id}
                      className="relative"
                      animate={{ rotate: buddyStage.game === 'tug' ? 6 : 0 }}
                      transition={springs.settle}
                    >
                      <PetSprite species={buddy.species} mood="excited" accessory={buddy.accessory} label={`${buddy.name} is playing too`} className="w-[min(28vw,10rem)]" />
                    </motion.div>
                  )}
                  {buddy && buddyStage?.game === 'catch' && <CatchProp key={`catch-${buddyStage.key}`} />}
                  {buddy && buddyStage?.game === 'tug' && <TugProp key={`tug-${buddyStage.key}`} />}
                  {buddy && bursts.map((b) => <Burst key={`burst-${b.id}`} kind={b.kind} x={b.x} y={b.y} />)}
                </motion.div>
              </Stage>

              {/* Nameplate for the pet on stage; moves up out of the way of a cuddle pile */}
              <motion.div
                layout
                transition={springs.settle}
                className={`sticker absolute left-5 z-10 max-w-[38%] px-3 py-2 sm:left-6 sm:max-w-[55%] sm:px-4 ${cuddlePile ? 'top-5 sm:top-6' : 'bottom-5 sm:bottom-6'}`}
              >
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
              </motion.div>

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

          <AnimatePresence mode="wait">
            {tray === 'food' && <FoodTray key="food" id="care-tray" inventory={state.inventory} onPick={feed} onClose={closeTray} />}
            {tray === 'play' && <PlayTray key="play" id="care-tray" toys={state.owned.toys} onPlay={(toy) => care(toy)} onClose={closeTray} />}
            {tray === 'together' && (
              <TogetherTray
                key="together"
                id="care-tray"
                lead={pet}
                others={others}
                onGame={playTogether}
                onNap={() => napTogether(state.pets.filter((p) => !p.sleeping).map((p) => p.id))}
                onDinner={dinner}
                onClose={closeTray}
              />
            )}
          </AnimatePresence>

          <div
            ref={actionsRef}
            role="group"
            aria-label="Care actions"
            className={`grid gap-2 sm:gap-3 ${hasFriends ? 'grid-cols-5' : 'grid-cols-4'}`}
          >
            <ActionButton
              ref={(el) => {
                trayButtons.current.food = el
              }}
              icon="bowl"
              label="Feed"
              tone="peach"
              badge={foodCount}
              disabled={sleeping}
              expanded={tray === 'food'}
              controls="care-tray"
              onClick={() => toggleTray('food')}
            />
            <ActionButton icon="hand" label="Pet" tone="blush" disabled={sleeping} onClick={() => care('pet')} />
            <ActionButton
              ref={(el) => {
                trayButtons.current.play = el
              }}
              icon="yarn"
              label="Play"
              tone="lavender"
              disabled={sleeping}
              expanded={tray === 'play'}
              controls="care-tray"
              onClick={() => toggleTray('play')}
            />
            {hasFriends && (
              <ActionButton
                ref={(el) => {
                  trayButtons.current.together = el
                }}
                icon="heart"
                label="Together"
                tone="berry"
                disabled={sleeping}
                expanded={tray === 'together'}
                controls="care-tray"
                onClick={() => toggleTray('together')}
              />
            )}
            {sleeping ? (
              <ActionButton icon="sun" label="Wake" tone="peach" onClick={wake} />
            ) : (
              <ActionButton icon="moon" label="Sleep" tone="lavender" onClick={sleep} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <aside aria-label={`How ${pet.name} is doing`} className="sticker stitch p-4 sm:p-6">
            <h2 className="sr-only lg:not-sr-only lg:mb-3 lg:text-lg">How {pet.name} feels</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-3">
              {STAT_KEYS.map((k) => (
                <StatBar key={k} label={STAT_LABEL[k]} icon={STAT_STYLE[k].icon} tone={STAT_STYLE[k].tone} value={stats[k]} delta={deltas[k]} />
              ))}
            </div>
            {sleeping && (
              <p className="mt-3 text-sm font-bold text-cocoa-soft">
                {others.some((o) => o.sleeping) ? `${pet.name} is napping with friends.` : `${pet.name} is sleeping.`} Energy is coming back.
              </p>
            )}
            <FriendsList state={state} pet={pet} />
          </aside>
          <DailyGoals daily={state.daily} petCount={state.pets.length} onClaim={claimGoal} />
        </div>
      </main>
    </div>
  )
}
