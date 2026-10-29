export type Species = 'puppy' | 'kitten' | 'bunny' | 'horse'

/** Visual state of a pet. Drives every part animation in the pet rigs. */
export type PetMood = 'idle' | 'happy' | 'excited' | 'eating' | 'sleeping' | 'walking' | 'hungry' | 'tired'

export type Accessory = 'bow' | 'bandana' | 'crown'

export type AdoptedPet = {
  species: Species
  name: string
}
