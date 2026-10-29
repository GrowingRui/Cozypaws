import type { GameEvent, PetState } from './state'
import type { Species } from './types'

/** What the pet says. Kept apart from the rules so wording can change freely. */

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]!

const FEED = {
  kibble: ['Crunch crunch!', 'Yum! So tasty!', 'Kibble, my old friend.'],
  cookie: ['A treat? For me?!', 'Best snack ever!', 'Sweet as a star!'],
  veggies: ['Fresh and crunchy!', 'I feel healthy already!', 'Greens make me strong!'],
}

const CONTENT: Record<Species, string[]> = {
  puppy: ['Is it snack o’clock yet?', 'Wanna play? Wanna play?', 'You’re my favourite human!'],
  kitten: ['That sunbeam looks comfy.', 'Mrrp.', 'I was not sleeping. I was resting my eyes.'],
  bunny: ['*nose wiggle*', 'This rug is nice and soft.', 'I like it here with you.'],
  horse: ['I could go for a walk.', 'What a lovely day.', 'Do you hear birds outside?'],
}

export function eventLine(event: GameEvent, species: Species): string {
  if (event.levelUp) return `Level ${event.levelUp}! Look at me grow!`
  switch (event.kind) {
    case 'feed':
      if (event.food === 'veggies' && species === 'bunny') return 'Carrots! My favourite!'
      return pick(FEED[event.food ?? 'kibble'])
    case 'pet':
      return event.diminished ? pick(['Okay, okay, I feel loved!', 'Hehe, maybe a little break?']) : pick(['Hehe, that tickles!', 'More pats, please!', 'I love you too!'])
    case 'play':
      return event.diminished ? 'Phew, that was a lot of yarn!' : pick(['Got it! Got it!', 'Again! Again!', 'This yarn is mine!'])
    case 'fetch':
      return event.diminished ? 'Huff... one more?' : pick(['Fetch! Here it is!', 'Throw it again!', 'I caught it!'])
    case 'adopt':
      return pick(['Is this my new home?', 'Hello, new family!', 'I love it here already!'])
    case 'switch':
      return pick(['My turn? Yay!', 'You picked me!', 'Hi again!'])
    case 'sleep':
      return pick(['Goodnight...', '*yawn* Nap time.'])
    case 'wake':
      return event.rested ? pick(['Good morning!', 'I feel brand new!']) : 'Mmh... five more minutes?'
    case 'refuse':
      switch (event.reason) {
        case 'full':
          return pick(['I’m too full!', 'Maybe later, my tummy is full.'])
        case 'noFood':
          return 'That one’s all gone.'
        case 'houseFull':
          return 'Our home is full of friends already!'
        case 'tooTired':
          return pick(['Too sleepy to play...', '*yawn* Maybe after a nap?'])
        default:
          return 'Zzz...'
      }
  }
}

/** Occasional unprompted chatter, based on how the pet is doing. */
export function idleLine(pet: PetState): string | null {
  if (pet.sleeping) return null
  const s = pet.stats
  if (s.health < 35) return 'I don’t feel so good...'
  if (s.fullness < 25) return pick(['My tummy is rumbling...', 'Is it snack time?'])
  if (s.energy < 20) return pick(['*yawn*', 'I could use a nap...'])
  if (s.happiness < 35) return pick(['Play with me?', 'I missed you!'])
  return pick(CONTENT[pet.species])
}
