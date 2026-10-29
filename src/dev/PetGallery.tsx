import { SPECIES, SPECIES_ORDER } from '../game/pets'
import type { Accessory, PetMood } from '../game/types'
import { PetSprite } from '../pets/PetSprite'

const MOODS: PetMood[] = ['idle', 'happy', 'excited', 'eating', 'sleeping', 'walking', 'hungry', 'tired']
const ACCESSORIES: Accessory[] = ['bow', 'bandana', 'crown']

/** Dev-only sheet of every pet × mood × accessory. Open with ?gallery while running `npm run dev`. */
export function PetGallery() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl">Pet gallery</h1>
      {SPECIES_ORDER.map((id) => (
        <section key={id} className="mb-8">
          <h2 className="mb-2 text-xl">{SPECIES[id].kind}</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
            {MOODS.map((mood) => (
              <figure key={mood} className="sticker flex flex-col items-center p-2">
                <PetSprite species={id} mood={mood} label={`${id} ${mood}`} className="w-full" />
                <figcaption className="text-xs font-bold">{mood}</figcaption>
              </figure>
            ))}
            {ACCESSORIES.map((a) => (
              <figure key={a} className="sticker flex flex-col items-center bg-blush-soft p-2">
                <PetSprite species={id} accessory={a} label={`${id} ${a}`} className="w-full" />
                <figcaption className="text-xs font-bold">{a}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
