import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CoinChip } from '../components/CoinChip'
import { STAT_LABEL } from '../components/FoodTray'
import { Icon } from '../components/Icon'
import { springs } from '../components/tones'
import { useGame } from '../game/GameContext'
import { STAT_KEYS, type CompanionMode, type StudyConfig, type StudySession } from '../game/state'
import { BREAK_PRESETS, FOCUS_MAX, FOCUS_MIN, FOCUS_PRESETS, logForToday, MAX_ROUNDS, MINUTES_PER_COIN, phaseRemaining } from '../game/study'
import { notify, playChime, requestNotifications } from '../lib/alerts'
import { PetSprite } from '../pets/PetSprite'
import { StudyRoom } from './StudyRoom'

type Choice = CompanionMode | 'home'

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const primaryButton =
  'min-h-14 rounded-full bg-berry px-6 font-display text-lg text-milk shadow-[0_2px_0_var(--color-berry-deep),0_12px_24px_-10px_rgb(176_67_108/0.6)] hover:bg-berry-deep disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton = 'min-h-12 rounded-full border-2 border-cocoa/15 bg-cream px-5 font-bold hover:border-cocoa/30'

export function StudyScreen({ onDone }: { onDone: () => void }) {
  const { state, closeStudy } = useGame()
  const session = state.study
  const [now, setNow] = useState(() => Date.now())
  const seenEvent = useRef(state.event?.id ?? 0)

  // A local clock for the countdown display; the game's own tick handles phase changes.
  useEffect(() => {
    if (!session || session.phase === 'done') return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [session])

  // Chime + background notification when a phase changes.
  useEffect(() => {
    const e = state.event
    if (!e || e.id <= seenEvent.current) return
    seenEvent.current = e.id
    if (e.kind !== 'study' || !session) return
    if (e.studyPhase === 'break') {
      playChime()
      notify('Focus round done!', `Time for a ${session.config.breakMin}-minute break.`)
    } else if (e.studyPhase === 'done' && !session.endedEarly) {
      playChime()
      notify('Study session complete!', `You focused for ${session.focusedMinutes} minutes.`)
    } else if (e.studyPhase === 'focus' && session.round > 1) {
      playChime()
      notify('Break is over', `Round ${session.round} of ${session.config.rounds}. Let's focus.`)
    }
  }, [state.event, session])

  // Countdown in the browser tab title.
  useEffect(() => {
    if (!session || session.phase === 'done') {
      document.title = 'CozyPaws'
      return
    }
    const label = session.pausedAt ? 'Paused' : session.phase === 'focus' ? 'Focus' : 'Break'
    document.title = `${fmt(phaseRemaining(session, now))} ${label} | CozyPaws`
  }, [session, now])
  useEffect(() => () => void (document.title = 'CozyPaws'), [])

  const companions = (session?.companions ?? [])
    .map((c) => ({ pet: state.pets.find((p) => p.id === c.petId), mode: c.mode }))
    .filter((c): c is { pet: NonNullable<typeof c.pet>; mode: CompanionMode } => !!c.pet)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6 lg:pb-32">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl">
          <Icon name="book" size={26} className="text-berry" />
          {session ? (session.phase === 'done' ? 'Study session' : 'Studying') : 'Study with your pets'}
        </h1>
        <CoinChip coins={state.coins} />
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {session ? (
          <>
            <StudyRoom compact decor={state.owned.decor} companions={companions} phase={session.phase === 'break' ? 'break' : session.phase === 'focus' && !session.pausedAt ? 'focus' : 'idle'} />
            <section aria-label="Study timer" className="sticker stitch flex flex-col gap-4 p-4 sm:p-6">
              {session.phase === 'done' ? (
                <Summary
                  session={session}
                  onDone={() => {
                    closeStudy()
                    onDone()
                  }}
                />
              ) : (
                <Timer session={session} now={now} />
              )}
            </section>
          </>
        ) : (
          <Setup />
        )}
      </main>
    </div>
  )
}

function Setup() {
  const { state, startStudy } = useGame()
  const [config, setConfig] = useState<StudyConfig>({ focusMin: 25, breakMin: 5, rounds: 4 })
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(state.pets.map((p) => [p.id, p.id === state.activeId ? (p.sleeping ? 'nap' : 'hang') : 'home'])),
  )
  const log = logForToday(state.studyLog, Date.now())
  const company = state.pets.filter((p) => choices[p.id] !== 'home')
  const preview = company.map((pet) => ({ pet, mode: choices[pet.id] as CompanionMode }))

  const begin = () => {
    requestNotifications()
    startStudy(
      config,
      company.map((p) => ({ petId: p.id, mode: choices[p.id] as CompanionMode })),
    )
  }

  return (
    <>
      <StudyRoom companions={preview} phase="idle" compact decor={state.owned.decor} />
      <section aria-label="Set up a study session" className="sticker stitch flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          <span className="rounded-full bg-lavender-soft px-3 py-1 text-[#6a55a8]">Today: {log.minutesToday} min focused</span>
          {log.streak > 0 && <span className="rounded-full bg-peach-soft px-3 py-1 text-[#b5602b]">Streak: {log.streak} {log.streak === 1 ? 'day' : 'days'}</span>}
        </div>

        <Field label="Focus time">
          <div className="flex flex-wrap items-center gap-2">
            {FOCUS_PRESETS.map((m) => (
              <Chip key={m} on={config.focusMin === m} onClick={() => setConfig((c) => ({ ...c, focusMin: m }))}>
                {m} min
              </Chip>
            ))}
            <Stepper
              label="Custom focus minutes"
              value={config.focusMin}
              suffix="min"
              onChange={(v) => setConfig((c) => ({ ...c, focusMin: Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, v)) }))}
              step={5}
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Field label="Break">
            <div className="flex flex-wrap gap-2">
              {BREAK_PRESETS.map((m) => (
                <Chip key={m} on={config.breakMin === m} onClick={() => setConfig((c) => ({ ...c, breakMin: m }))}>
                  {m} min
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Rounds">
            <Stepper label="Rounds" value={config.rounds} onChange={(v) => setConfig((c) => ({ ...c, rounds: Math.min(MAX_ROUNDS, Math.max(1, v)) }))} step={1} />
          </Field>
        </div>

        <Field label="Who keeps you company?">
          <ul className="flex flex-col gap-2">
            {state.pets.map((p) => (
              <li key={p.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] lg:grid-cols-[2.5rem_minmax(0,1fr)]">
                <PetSprite species={p.species} mood={p.sleeping ? 'sleeping' : 'idle'} label="" className="row-span-2 w-10 sm:row-span-1 lg:row-span-2" />
                <span className="truncate text-sm font-bold">{p.name}</span>
                <div role="radiogroup" aria-label={`What ${p.name} does`} className="flex w-fit rounded-full bg-cream p-0.5 shadow-[var(--shadow-base)]">
                  {(
                    [
                      ['nap', 'Nap'],
                      ['hang', 'Hang out'],
                      ['home', 'Stay home'],
                    ] as const
                  ).map(([value, text]) => {
                    const on = choices[p.id] === value
                    const disabled = value === 'hang' && p.sleeping
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => setChoices((c) => ({ ...c, [p.id]: value }))}
                        className={`relative min-h-10 rounded-full px-2.5 text-xs font-bold active:scale-95 disabled:opacity-40 sm:px-3 ${on ? 'text-cocoa' : 'text-cocoa-soft'}`}
                      >
                        {on && <motion.span layoutId={`mode-${p.id}`} className="absolute inset-0 rounded-full bg-blush-soft" transition={springs.settle} />}
                        <span className="relative">{text}</span>
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-cocoa-soft">Pets keeping you company won&rsquo;t get hungry or sad. Napping pets regain energy.</p>
        </Field>

        <div className="sticky bottom-[6.5rem] z-10 flex flex-col gap-1 lg:static">
          <motion.button type="button" onClick={begin} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} transition={springs.pop} className={primaryButton}>
            Start {config.focusMin}-minute focus
          </motion.button>
        </div>
        <p className="-mt-2 text-center text-xs text-cocoa-soft">
          About 1 coin for every {MINUTES_PER_COIN} minutes, paid when a round is finished.
        </p>
      </section>
    </>
  )
}

function Timer({ session, now }: { session: StudySession; now: number }) {
  const { state, pauseStudy, resumeStudy, skipBreak, endStudy, careFor } = useGame()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const remaining = phaseRemaining(session, now)
  const total = session.phaseEndsAt - session.phaseStartedAt
  const progress = total > 0 ? 1 - remaining / total : 1
  const paused = session.pausedAt !== null
  const focus = session.phase === 'focus'
  const R = 88
  const C = 2 * Math.PI * R

  useEffect(() => {
    if (!confirmEnd) return
    const t = setTimeout(() => setConfirmEnd(false), 3500)
    return () => clearTimeout(t)
  }, [confirmEnd])

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-[min(52vw,15rem)]">
          <svg viewBox="0 0 200 200" className="w-full -rotate-90" aria-hidden="true">
            <circle cx={100} cy={100} r={R} fill="none" stroke={focus ? '#fbdbe2' : '#e0f3e8'} strokeWidth={12} />
            <circle
              cx={100}
              cy={100}
              r={R}
              fill="none"
              stroke={focus ? '#e5799a' : '#7fbf9b'}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl tabular-nums tracking-tight" role="timer" aria-live="off">
              {fmt(remaining)}
            </span>
            <span className="mt-1 text-sm font-bold text-cocoa-soft">{paused ? 'Paused' : focus ? 'Focus' : 'Break'}</span>
          </div>
        </div>
        <p className="text-sm font-bold" aria-live="polite">
          {focus ? `Round ${session.round} of ${session.config.rounds}` : `Break, then round ${session.round + 1} of ${session.config.rounds}`}
        </p>
        <div className="flex gap-1.5" aria-label={`${session.completedRounds} of ${session.config.rounds} rounds finished`}>
          {Array.from({ length: session.config.rounds }, (_, i) => (
            <span key={i} className={`size-2.5 rounded-full ${i < session.completedRounds ? 'bg-berry' : 'bg-cocoa/15'}`} />
          ))}
        </div>
      </div>

      {!focus && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[var(--radius-chip)] bg-mint-soft p-3 text-center">
          <p className="mb-2 text-sm font-bold">Break time! Give your study buddies a pat?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {session.companions.map((c) => {
              const pet = state.pets.find((p) => p.id === c.petId)
              if (!pet) return null
              return (
                <motion.button
                  key={pet.id}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  transition={springs.pop}
                  onClick={() => careFor(pet.id, 'pet')}
                  className="flex min-h-11 items-center gap-1 rounded-full bg-milk px-3 text-sm font-bold shadow-[var(--shadow-base)]"
                >
                  <Icon name="hand" size={18} className="text-berry" />
                  Pat {pet.name}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {focus ? (
          <motion.button type="button" whileTap={{ scale: 0.96 }} transition={springs.pop} onClick={paused ? resumeStudy : pauseStudy} className={`${secondaryButton} flex items-center justify-center gap-1.5`}>
            <Icon name={paused ? 'play' : 'pause'} size={18} />
            {paused ? 'Resume' : 'Pause'}
          </motion.button>
        ) : (
          <motion.button type="button" whileTap={{ scale: 0.96 }} transition={springs.pop} onClick={skipBreak} className={secondaryButton}>
            Skip break
          </motion.button>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={springs.pop}
          onClick={() => (confirmEnd ? endStudy() : setConfirmEnd(true))}
          className={`${secondaryButton} ${confirmEnd ? 'border-berry/60 text-berry' : ''}`}
        >
          {confirmEnd ? 'Tap again to end' : 'End session'}
        </motion.button>
      </div>
      <AnimatePresence>
        {confirmEnd && focus && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="-mt-2 text-center text-xs text-cocoa-soft">
            This round won&rsquo;t count if you stop now. Finished rounds keep their rewards.
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}

function Summary({ session, onDone }: { session: StudySession; onDone: () => void }) {
  const { state } = useGame()
  const log = logForToday(state.studyLog, Date.now())
  const finished = !session.endedEarly
  return (
    <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.settle}>
      <div>
        <h2 className="text-2xl">{finished ? 'Session complete!' : session.completedRounds > 0 ? 'Nice work!' : 'Session ended'}</h2>
        <p className="text-sm text-cocoa-soft">
          {session.completedRounds} of {session.config.rounds} rounds finished, {session.focusedMinutes} minutes of focus.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm font-bold">
        <span className="flex items-center gap-1 rounded-full bg-peach-soft px-3 py-1 text-[#b5602b]">
          <Icon name="coin" size={16} />+{session.coins} {session.coins === 1 ? 'coin' : 'coins'}
        </span>
        {session.xp > 0 && <span className="rounded-full bg-lavender-soft px-3 py-1 text-[#6a55a8]">+{session.xp} XP each</span>}
        {log.streak > 0 && <span className="rounded-full bg-blush-soft px-3 py-1 text-berry">Streak: {log.streak} {log.streak === 1 ? 'day' : 'days'}</span>}
      </div>
      {session.companions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {session.companions.map((c) => {
            const pet = state.pets.find((p) => p.id === c.petId)
            if (!pet) return null
            const gains = session.gains[c.petId] ?? {}
            const shown = STAT_KEYS.filter((k) => Math.round(gains[k] ?? 0) !== 0)
            return (
              <li key={c.petId} className="flex items-center gap-2 rounded-[var(--radius-chip)] bg-cream p-2">
                <PetSprite species={pet.species} mood="happy" label="" className="w-10 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {pet.name} <span className="font-normal text-cocoa-soft">{c.mode === 'nap' ? 'napped' : 'kept you company'}</span>
                  </p>
                  <p className="flex flex-wrap gap-x-2 text-xs text-[#2f7a57]">
                    {shown.length === 0 ? <span className="text-cocoa-soft">Cosy and content</span> : shown.map((k) => <span key={k}>+{Math.round(gains[k]!)} {STAT_LABEL[k]}</span>)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <motion.button type="button" onClick={onDone} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} transition={springs.pop} className={primaryButton}>
        Done
      </motion.button>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-body text-sm font-bold text-cocoa-soft">{label}</h2>
      {children}
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={springs.pop}
      className={`min-h-11 rounded-full border-2 px-4 text-sm font-bold ${on ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream hover:border-cocoa/25'}`}
    >
      {children}
    </motion.button>
  )
}

function Stepper({ label, value, onChange, step, suffix }: { label: string; value: number; onChange: (v: number) => void; step: number; suffix?: string }) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-full bg-cream p-0.5 shadow-[var(--shadow-base)]" role="group" aria-label={label}>
      <button type="button" aria-label={`Less ${label.toLowerCase()}`} onClick={() => onChange(value - step)} className="grid size-10 place-items-center rounded-full text-lg font-bold hover:bg-cocoa/5 active:scale-90">
        &minus;
      </button>
      <span className="min-w-14 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </span>
      <button type="button" aria-label={`More ${label.toLowerCase()}`} onClick={() => onChange(value + step)} className="grid size-10 place-items-center rounded-full text-lg font-bold hover:bg-cocoa/5 active:scale-90">
        +
      </button>
    </div>
  )
}
