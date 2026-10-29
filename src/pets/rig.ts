import type { Accessory, PetMood } from '../game/types'

/** The contract every pet drawing implements. Swap a rig's artwork freely as long as it keeps these props. */
export type RigProps = {
  mood: PetMood
  blink: boolean
  accessory?: Accessory | null
}
