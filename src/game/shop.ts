import type { IconName } from '../components/Icon'
import type { Tone } from '../components/tones'
import { emit, refuse, replacePet } from './core'
import { FOODS, type FoodId } from './items'
import type { DecorId, GameState, ToyId } from './state'
import { SNUGGLE_FRIENDSHIP } from './together'
import type { Accessory } from './types'

/** The shop catalogue and buying rules. Prices are balanced against walk, play and study earnings. */

export type ShopCategory = 'food' | 'toys' | 'accessories' | 'decor'

type Unlock = { level: number } | { friendship: number }

export type ShopItem =
  | { id: FoodId; category: 'food'; name: string; price: number; icon: IconName; tone: Tone; blurb: string; unlock?: Unlock }
  | { id: ToyId; category: 'toys'; name: string; price: number; icon: IconName; tone: Tone; blurb: string; unlock?: Unlock }
  | { id: Accessory; category: 'accessories'; name: string; price: number; icon: IconName; tone: Tone; blurb: string; unlock?: Unlock }
  | { id: DecorId; category: 'decor'; name: string; price: number; icon: IconName; tone: Tone; blurb: string; unlock?: Unlock }

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'kibble', category: 'food', name: FOODS.kibble.name, price: 4, icon: 'bowl', tone: 'peach', blurb: '+30 Tummy, a filling everyday meal.' },
  { id: 'veggies', category: 'food', name: FOODS.veggies.name, price: 5, icon: 'carrot', tone: 'mint', blurb: '+20 Tummy and +10 Health.' },
  { id: 'cookie', category: 'food', name: FOODS.cookie.name, price: 6, icon: 'cookie', tone: 'blush', blurb: '+15 Happiness, a little Bond too.' },
  { id: 'smoothie', category: 'food', name: FOODS.smoothie.name, price: 8, icon: 'cup', tone: 'lavender', blurb: '+15 Energy, for a pick-me-up.' },
  { id: 'cake', category: 'food', name: FOODS.cake.name, price: 15, icon: 'cake', tone: 'peach', blurb: '+20 Happiness and +8 Bond. A big treat.', unlock: { level: 3 } },
  { id: 'feather', category: 'toys', name: 'Feather wand', price: 35, icon: 'feather', tone: 'lavender', blurb: 'A new game in Play. Easy on energy.' },
  { id: 'bubbles', category: 'toys', name: 'Bubble wand', price: 45, icon: 'bubbles', tone: 'mint', blurb: 'A new game in Play. Happiness and Health.', unlock: { level: 2 } },
  { id: 'bow', category: 'accessories', name: 'Pink bow', price: 25, icon: 'hanger', tone: 'blush', blurb: 'A sweet bow for any pet to wear.' },
  { id: 'bandana', category: 'accessories', name: 'Mint bandana', price: 30, icon: 'hanger', tone: 'mint', blurb: 'A polka-dot bandana, adventure-ready.' },
  { id: 'crown', category: 'accessories', name: 'Flower crown', price: 40, icon: 'hanger', tone: 'lavender', blurb: 'Five little flowers in a ring.', unlock: { level: 3 } },
  {
    id: 'friendBandana',
    category: 'accessories',
    name: 'Friendship bandana',
    price: 35,
    icon: 'hanger',
    tone: 'blush',
    blurb: 'For pets who are Pals. Hearts included.',
    unlock: { friendship: SNUGGLE_FRIENDSHIP },
  },
  { id: 'lights', category: 'decor', name: 'Fairy lights', price: 40, icon: 'lights', tone: 'peach', blurb: 'Warm twinkly lights for the study room.' },
  { id: 'plant', category: 'decor', name: 'Desk plant', price: 25, icon: 'leaf', tone: 'mint', blurb: 'A happy little plant by the study desk.' },
]

export const CATEGORY_LABEL: Record<ShopCategory, string> = { food: 'Food', toys: 'Toys', accessories: 'Accessories', decor: 'Study decor' }
export const CATEGORY_ORDER: ShopCategory[] = ['food', 'toys', 'accessories', 'decor']

export const itemById = (id: string) => SHOP_ITEMS.find((i) => i.id === id)

/** Highest level in the household; level unlocks use the most experienced pet. */
export const householdLevel = (state: GameState) => Math.max(...state.pets.map((p) => p.level))
export const bestFriendship = (state: GameState) => Math.max(0, ...Object.values(state.friendships))

export function isUnlocked(state: GameState, item: ShopItem): boolean {
  if (!item.unlock) return true
  if ('level' in item.unlock) return householdLevel(state) >= item.unlock.level
  return bestFriendship(state) >= item.unlock.friendship
}

export function unlockHint(item: ShopItem): string | null {
  if (!item.unlock) return null
  return 'level' in item.unlock ? `Unlocks when a pet reaches level ${item.unlock.level}` : 'Unlocks when two pets become Pals'
}

export function isOwned(state: GameState, item: ShopItem): boolean {
  switch (item.category) {
    case 'food':
      return false
    case 'toys':
      return state.owned.toys.includes(item.id)
    case 'accessories':
      return state.owned.accessories.includes(item.id)
    case 'decor':
      return state.owned.decor.includes(item.id)
  }
}

export function buy(state: GameState, itemId: string, quantity = 1): GameState {
  const item = itemById(itemId)
  if (!item) return state
  const qty = item.category === 'food' ? Math.max(1, Math.min(10, Math.floor(quantity))) : 1
  if (!isUnlocked(state, item)) return refuse(state, 'locked')
  if (isOwned(state, item)) return refuse(state, 'owned')
  const cost = item.price * qty
  if (state.coins < cost) return refuse(state, 'notEnoughCoins')

  let next: GameState = { ...state, coins: state.coins - cost }
  switch (item.category) {
    case 'food':
      next = { ...next, inventory: { ...next.inventory, [item.id]: next.inventory[item.id] + qty } }
      break
    case 'toys':
      next = { ...next, owned: { ...next.owned, toys: [...next.owned.toys, item.id] } }
      break
    case 'accessories':
      next = { ...next, owned: { ...next.owned, accessories: [...next.owned.accessories, item.id] } }
      break
    case 'decor':
      next = { ...next, owned: { ...next.owned, decor: [...next.owned.decor, item.id] } }
      break
  }
  return emit(next, state.activeId, { kind: 'buy', itemId, quantity: qty, coins: -cost })
}

/** Puts an owned accessory on a pet (or takes it off with null). */
export function equip(state: GameState, petId: string, accessory: Accessory | null): GameState {
  const pet = state.pets.find((p) => p.id === petId)
  if (!pet) return state
  if (accessory && !state.owned.accessories.includes(accessory)) return refuse(state, 'locked')
  if (pet.accessory === accessory) return state
  return emit(replacePet(state, { ...pet, accessory }), petId, { kind: 'equip', itemId: accessory ?? undefined })
}
