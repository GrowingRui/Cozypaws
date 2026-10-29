import type { IconName } from '../components/Icon'
import type { Tone } from '../components/tones'
import type { Stats } from './state'

export type FoodId = 'kibble' | 'cookie' | 'veggies' | 'smoothie' | 'cake'

export type FoodInfo = {
  id: FoodId
  name: string
  icon: IconName
  tone: Tone
  /** Stat changes when eaten. Each food has a distinct speciality. */
  effect: Partial<Stats>
  xp: number
}

export const FOODS: Record<FoodId, FoodInfo> = {
  kibble: { id: 'kibble', name: 'Kibble', icon: 'bowl', tone: 'peach', effect: { fullness: 30, happiness: 4, health: 2 }, xp: 6 },
  cookie: { id: 'cookie', name: 'Star cookie', icon: 'cookie', tone: 'blush', effect: { fullness: 12, happiness: 15, bond: 3 }, xp: 8 },
  veggies: { id: 'veggies', name: 'Veggie bowl', icon: 'carrot', tone: 'mint', effect: { fullness: 20, health: 10, happiness: 3 }, xp: 8 },
  smoothie: { id: 'smoothie', name: 'Berry smoothie', icon: 'cup', tone: 'lavender', effect: { energy: 15, fullness: 8, happiness: 5 }, xp: 8 },
  cake: { id: 'cake', name: 'Honey cake', icon: 'cake', tone: 'peach', effect: { happiness: 20, bond: 8, fullness: 15 }, xp: 14 },
}

export const FOOD_ORDER: FoodId[] = ['kibble', 'cookie', 'veggies', 'smoothie', 'cake']
/** Everyday foods: found on walks and used first at dinner. */
export const BASIC_FOODS: FoodId[] = ['kibble', 'cookie', 'veggies']
