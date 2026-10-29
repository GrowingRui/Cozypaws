import { addStats, addXp, applyStats, diff, emit, refuse, repeatFactor, replacePet, scaleGains } from './core'
import { FOODS, type FoodId } from './items'
import { activePet, pairKey, type GameState, type PetState, type Stats, type TogetherGame } from './state'

/** Rules for pets doing things together. All pets belong to the same player. */

export const TOGETHER: Record<TogetherGame, { change: Partial<Stats>; minEnergy: number; friendship: number; xp: number; coins: number }> = {
  catch: { change: { happiness: 14, bond: 4, energy: -14, fullness: -5 }, minEnergy: 20, friendship: 5, xp: 12, coins: 3 },
  tug: { change: { happiness: 12, bond: 5, energy: -10, fullness: -4 }, minEnergy: 15, friendship: 6, xp: 12, coins: 3 },
}
/** Extra happiness for doing something with a friend. */
export const SOCIAL_HAPPINESS = 3
/** Friendship needed before napping together speeds up rest. */
export const SNUGGLE_FRIENDSHIP = 20
export const SNUGGLE_ENERGY_BOOST = 1.25
/** Friendship gained per minute by each pair napping at the same time. */
export const NAP_FRIENDSHIP_PER_MIN = 0.5
export const DINNER_HAPPINESS = 3
export const DINNER_FRIENDSHIP = 2
/** Pets greeting each other on their own. */
export const SOCIAL_FRIENDSHIP = 1

export const friendshipOf = (state: GameState, a: string, b: string) => state.friendships[pairKey(a, b)] ?? 0

export type FriendLevel = { label: string; tier: 0 | 1 | 2 | 3 }
export function friendLevel(value: number): FriendLevel {
  if (value >= 80) return { label: 'Best friends', tier: 3 }
  if (value >= 50) return { label: 'Good friends', tier: 2 }
  if (value >= SNUGGLE_FRIENDSHIP) return { label: 'Pals', tier: 1 }
  return { label: 'New friends', tier: 0 }
}

function addFriendship(state: GameState, ids: string[], gain: number): GameState {
  if (gain <= 0 || ids.length < 2) return state
  const friendships = { ...state.friendships }
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const key = pairKey(ids[i]!, ids[j]!)
      friendships[key] = Math.min(100, (friendships[key] ?? 0) + gain)
    }
  return { ...state, friendships }
}

const awake = (p: PetState | undefined): p is PetState => !!p && !p.sleeping

/** The pet on stage plays a game with one buddy. Both gain, and their friendship grows. */
export function playTogether(state: GameState, buddyId: string, game: TogetherGame, now: number): GameState {
  const lead = activePet(state)
  const buddy = state.pets.find((p) => p.id === buddyId)
  if (!buddy || buddy.id === lead.id) return refuse(state, 'needTwo')
  if (lead.sleeping) return refuse(state, 'asleep')
  const def = TOGETHER[game]
  if (lead.stats.energy < def.minEnergy) return refuse(state, 'tooTired')
  if (buddy.sleeping || buddy.stats.energy < def.minEnergy) return emit(state, lead.id, { kind: 'refuse', reason: 'buddyTired', buddyId })

  const { recent, factor } = repeatFactor(lead.recent.together, now)
  const change = addStats(scaleGains(def.change, factor), { happiness: Math.round(SOCIAL_HAPPINESS * factor) })
  const xp = Math.round(def.xp * factor)
  const coins = factor < 1 ? 0 : def.coins

  let next = state
  let bonus = 0
  let leadDeltas: Partial<Stats> = {}
  let levelUp: number | undefined
  for (const pet of [{ ...lead, recent: { ...lead.recent, together: [...recent, now] } }, buddy]) {
    const stats = applyStats(pet.stats, change)
    const leveled = addXp({ ...pet, stats }, xp)
    bonus += leveled.bonus
    if (pet.id === lead.id) {
      leadDeltas = diff(pet.stats, stats)
      levelUp = leveled.levelUp
    }
    next = replacePet(next, leveled.pet)
  }
  const friendship = Math.round(def.friendship * factor)
  next = addFriendship({ ...next, coins: next.coins + coins + bonus }, [lead.id, buddy.id], friendship)
  return emit(next, lead.id, { kind: 'together', game, buddyId, deltas: leadDeltas, xp, coins: coins + bonus, levelUp, friendship, diminished: factor < 1 })
}

/** Everyone listed (who is awake) curls up for a nap together. */
export function napTogether(state: GameState, petIds: string[]): GameState {
  const nappers = petIds.map((id) => state.pets.find((p) => p.id === id)).filter(awake)
  if (nappers.length < 2) return refuse(state, 'needTwo')
  let next = state
  for (const pet of nappers) next = replacePet(next, { ...pet, sleeping: true })
  const lead = nappers.some((p) => p.id === state.activeId) ? state.activeId : nappers[0]!.id
  return emit({ ...next, activeId: lead }, lead, { kind: 'napTogether', petIds: nappers.map((p) => p.id) })
}

/** Food preference for dinner: the most filling food first, treats last. */
const DINNER_ORDER: FoodId[] = ['kibble', 'veggies', 'cookie']
export const DINNER_FULL = 90

/** Feeds every awake, not-full pet one portion from the shared bag, with a little social bonus. */
export function dinner(state: GameState): GameState {
  const diners = state.pets.filter((p) => awake(p) && p.stats.fullness < DINNER_FULL)
  if (diners.length === 0) return refuse(state, 'noOneHungry')

  let next = state
  const inventory = { ...state.inventory }
  const fed: string[] = []
  let leadDeltas: Partial<Stats> = {}
  let bonus = 0
  // Hungriest pets eat first, in case the bag runs out.
  for (const pet of [...diners].sort((a, b) => a.stats.fullness - b.stats.fullness)) {
    const food = DINNER_ORDER.find((f) => inventory[f] > 0)
    if (!food) break
    inventory[food] -= 1
    const info = FOODS[food]
    const stats = applyStats(pet.stats, addStats(info.effect, { happiness: DINNER_HAPPINESS }))
    const leveled = addXp({ ...pet, stats }, info.xp)
    bonus += leveled.bonus
    if (pet.id === state.activeId) leadDeltas = diff(pet.stats, stats)
    next = replacePet(next, leveled.pet)
    fed.push(pet.id)
  }
  if (fed.length === 0) return refuse(state, 'noFood')
  next = addFriendship({ ...next, inventory, coins: next.coins + bonus }, fed, DINNER_FRIENDSHIP)
  const lead = fed.includes(state.activeId) ? state.activeId : fed[0]!
  return emit(next, lead, { kind: 'dinner', petIds: fed, deltas: leadDeltas, coins: bonus, friendship: fed.length > 1 ? DINNER_FRIENDSHIP : 0 })
}

/** Two awake pets say hi to each other. Quiet: no event, just a little friendship. */
export function socialize(state: GameState, a: string, b: string): GameState {
  const pa = state.pets.find((p) => p.id === a)
  const pb = state.pets.find((p) => p.id === b)
  if (a === b || !awake(pa) || !awake(pb)) return state
  return addFriendship(state, [a, b], SOCIAL_FRIENDSHIP)
}

/** Pets sleeping at the same time as a pal rest faster, and every napping pair grows closer. */
export function napEffects(state: GameState, minutes: number): { energyBoost: Set<string>; next: GameState } {
  const sleepers = state.pets.filter((p) => p.sleeping)
  const energyBoost = new Set<string>()
  for (const p of sleepers)
    if (sleepers.some((o) => o.id !== p.id && friendshipOf(state, p.id, o.id) >= SNUGGLE_FRIENDSHIP)) energyBoost.add(p.id)
  return { energyBoost, next: addFriendship(state, sleepers.map((p) => p.id), NAP_FRIENDSHIP_PER_MIN * minutes) }
}
