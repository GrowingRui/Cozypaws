import type { FoodId } from './items'
import { FOODS } from './items'
import type { GameEvent, PetState, WalkEventKind } from './state'
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

export function eventLine(event: GameEvent, species: Species, nameOf: (id: string) => string = () => 'friend'): string {
  const buddy = event.buddyId ? nameOf(event.buddyId) : 'friend'
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
    case 'together':
      if (event.diminished) return 'Phew! Let’s catch our breath.'
      return event.game === 'tug'
        ? pick(['Pull, pull, pull!', `I’m winning, ${buddy}!`, 'Tug-of-war is the best!'])
        : pick([`Catch, ${buddy}!`, `Your turn, ${buddy}!`, 'Nice catch!'])
    case 'napTogether':
      return pick(['Snuggle time...', 'Goodnight, everyone.', 'Cosy pile!'])
    case 'dinner':
      return pick(['Dinner time! Yum!', 'Everyone eat up!', 'Best dinner party ever.'])
    case 'walk':
      return pick(['What a lovely walk!', 'Home sweet home!', 'Can we go again tomorrow?'])
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
        case 'buddyTired':
          return `${buddy} is too sleepy to play right now.`
        case 'needTwo':
          return 'This one needs a friend who’s awake.'
        case 'noOneHungry':
          return 'Nobody is hungry right now.'
        case 'cantWalk':
          return 'Someone is too sleepy for a walk.'
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

/** Lines for things that happen on a walk. `names` are the walkers, leader first. */
export function walkEventLine(kind: WalkEventKind, names: string[], food?: FoodId): { title: string; detail: string } {
  const lead = names[0] ?? 'Your pet'
  const pair = names.length > 1 ? `${names[0]} and ${names[1]}` : lead
  switch (kind) {
    case 'acorn':
      return { title: `${lead} found a shiny acorn!`, detail: '+3 coins' }
    case 'snack':
      return { title: `${lead} sniffed out a snack!`, detail: `+1 ${FOODS[food ?? 'cookie'].name}` }
    case 'friend':
      return { title: 'A friendly duck waddled over to say hi.', detail: '+2 Bond for everyone' }
    case 'butterfly':
      return { title: `${lead} chased a butterfly!`, detail: '+3 Happiness for everyone' }
    case 'bench':
      return { title: 'A sunny bench. Time for a little rest.', detail: '+5 Energy for everyone' }
    case 'flowers':
      return { title: 'A patch of flowers smells amazing.', detail: '+2 Health for everyone' }
    case 'puddle':
      return { title: `${pair} splashed in a puddle together!`, detail: '+4 Friendship' }
  }
}

export const WALK_CHATTER = ['What a lovely day!', 'Smell that? Flowers!', 'Wheee!', 'Look, a bird!', 'This is the best walk ever.']

export function walkChatter(): string {
  return pick(WALK_CHATTER)
}

/** What one pet says to another when they meet up on their own. */
export function greetingLine(name: string, bestFriends: boolean): string {
  if (bestFriends) return pick([`You’re my best friend, ${name}!`, `${name}! There you are!`])
  return pick([`Hi, ${name}!`, `Wanna play, ${name}?`, `Nice to see you, ${name}.`])
}
