import { FOOD_ORDER, FOODS, type FoodId } from '../game/items'
import type { StatKey } from '../game/state'
import { Icon } from './Icon'
import { toneClasses } from './tones'
import { TrayOption, TrayShell } from './TrayShell'

export const STAT_LABEL: Record<StatKey, string> = {
  fullness: 'Tummy',
  happiness: 'Happiness',
  energy: 'Energy',
  health: 'Health',
  bond: 'Bond',
}

type FoodTrayProps = {
  id: string
  inventory: Record<FoodId, number>
  onPick: (food: FoodId) => void
  onClose: () => void
}

/** Food picker that opens from the Feed button. */
export function FoodTray({ id, inventory, onPick, onClose }: FoodTrayProps) {
  return (
    <TrayShell id={id} title={'What’s for lunch?'} label="Choose a food" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {FOOD_ORDER.map((foodId) => {
          const food = FOODS[foodId]
          const count = inventory[foodId]
          const t = toneClasses[food.tone]
          const summary = Object.entries(food.effect)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([k, v]) => `+${v} ${STAT_LABEL[k as StatKey]}`)
          return (
            <TrayOption
              key={foodId}
              chip={`${t.chip} ${t.ink}`}
              icon={
                <>
                  <Icon name={food.icon} size={26} />
                  <span className="absolute -right-2 -top-1 min-w-5 rounded-full bg-cocoa px-1 text-[0.6875rem] font-bold leading-5 text-milk">
                    {count}
                  </span>
                </>
              }
              title={food.name}
              lines={count > 0 ? summary : ['None left']}
              disabled={count <= 0}
              onClick={() => onPick(foodId)}
              ariaLabel={`Feed ${food.name}, ${count} left. ${summary.join(', ')}`}
            />
          )
        })}
      </div>
    </TrayShell>
  )
}
