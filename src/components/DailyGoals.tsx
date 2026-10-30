import { motion } from 'motion/react'
import { goalDone, type DailyGoal, type DailyGoals as Daily, type GoalKind } from '../game/daily'
import { Icon, type IconName } from './Icon'
import { springs, toneClasses, type Tone } from './tones'

const GOAL_STYLE: Record<GoalKind, { icon: IconName; tone: Tone }> = {
  feed: { icon: 'bowl', tone: 'peach' },
  pat: { icon: 'hand', tone: 'blush' },
  play: { icon: 'yarn', tone: 'lavender' },
  nap: { icon: 'moon', tone: 'lavender' },
  walk: { icon: 'paw', tone: 'mint' },
  study: { icon: 'book', tone: 'mint' },
  together: { icon: 'heart', tone: 'berry' },
}

/** "Feed your pets 3 times", "Go for a walk". */
export function goalLabel(goal: Pick<DailyGoal, 'kind' | 'target'>, petCount = 2): string {
  const pets = petCount > 1 ? 'your pets' : 'your pet'
  switch (goal.kind) {
    case 'feed':
      return `Feed ${pets} ${goal.target} times`
    case 'pat':
      return `Give ${goal.target} pats`
    case 'play':
      return `Play ${goal.target} games`
    case 'nap':
      return 'Tuck a pet in for a nap'
    case 'walk':
      return 'Go for a walk'
    case 'study':
      return `Study for ${goal.target} minutes`
    case 'together':
      return `Do ${goal.target} things together`
  }
}

type DailyGoalsProps = { daily: Daily; petCount: number; onClaim: (index: number) => void }

/** Today's three goals on the home screen. Finished goals are claimed with a tap. */
export function DailyGoals({ daily, petCount, onClaim }: DailyGoalsProps) {
  if (!daily.goals.length) return null
  const claimed = daily.goals.filter((g) => g.claimed).length

  return (
    <section aria-labelledby="goals-title" className="sticker stitch p-4 sm:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="goals-title" className="text-lg">
          Today&rsquo;s goals
        </h2>
        <span className="text-sm font-bold tabular-nums text-cocoa-soft">
          {claimed} of {daily.goals.length} done
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {daily.goals.map((goal, i) => (
          <GoalRow key={`${daily.day}-${goal.kind}`} goal={goal} label={goalLabel(goal, petCount)} onClaim={() => onClaim(i)} />
        ))}
      </ul>

      <p className="mt-3 flex items-center gap-2 border-t-2 border-dashed border-cocoa/10 pt-3 text-sm leading-5 text-cocoa-soft">
        <Icon name="cake" size={18} className="shrink-0 text-[#b5602b]" />
        {daily.bonusClaimed ? 'All done for today. A honey cake is in your bag.' : 'Claim all three for a honey cake.'}
      </p>
    </section>
  )
}

function GoalRow({ goal, label, onClaim }: { goal: DailyGoal; label: string; onClaim: () => void }) {
  const t = toneClasses[GOAL_STYLE[goal.kind].tone]
  const done = goalDone(goal)

  return (
    <li className="flex items-center gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${goal.claimed ? 'bg-mint-soft text-[#2f7a57]' : `${t.chip} ${t.ink}`}`}>
        <Icon name={goal.claimed ? 'check' : GOAL_STYLE[goal.kind].icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-[0.8125rem] leading-5">
          <span className={`font-bold ${goal.claimed ? 'text-cocoa-soft' : ''}`}>{label}</span>
          {goal.target > 1 && !goal.claimed && (
            <span className="shrink-0 tabular-nums text-cocoa-soft">
              {goal.progress}/{goal.target}
            </span>
          )}
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={goal.target}
          aria-valuenow={goal.progress}
          className={`mt-1 h-1.5 overflow-hidden rounded-full ${t.track}`}
        >
          <motion.div
            className={`h-full w-full origin-left rounded-full ${goal.claimed ? 'bg-mint' : t.fill}`}
            initial={false}
            animate={{ scaleX: goal.progress / goal.target }}
            transition={springs.settle}
          />
        </div>
      </div>

      {done && !goal.claimed ? (
        <motion.button
          type="button"
          onClick={onClaim}
          aria-label={`Claim ${goal.coins} coins for: ${label}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={springs.pop}
          className="flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-berry px-3 text-sm font-bold text-milk shadow-[0_2px_0_var(--color-berry-deep)] hover:bg-berry-deep"
        >
          <Icon name="coin" size={16} />
          Claim {goal.coins}
        </motion.button>
      ) : (
        <span
          className={`flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums ${goal.claimed ? 'text-cocoa-soft/60 line-through' : 'text-[#b5602b]'}`}
          aria-label={goal.claimed ? 'Claimed' : `Worth ${goal.coins} coins`}
        >
          <Icon name="coin" size={16} />
          {goal.coins}
        </span>
      )}
    </li>
  )
}
