import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CoinChip } from '../components/CoinChip'
import { Icon } from '../components/Icon'
import { springs, toneClasses } from '../components/tones'
import { useGame } from '../game/GameContext'
import { FOOD_ORDER, FOODS } from '../game/items'
import { CATEGORY_LABEL, CATEGORY_ORDER, isOwned, isUnlocked, itemById, SHOP_ITEMS, unlockHint, type ShopCategory, type ShopItem } from '../game/shop'
import { activePet } from '../game/state'
import type { Accessory } from '../game/types'
import { PetSprite } from '../pets/PetSprite'

type Section = 'shop' | 'bag'

const primary =
  'min-h-11 rounded-full bg-berry px-4 text-sm font-bold text-milk shadow-[0_2px_0_var(--color-berry-deep)] hover:bg-berry-deep disabled:cursor-not-allowed disabled:bg-cocoa/15 disabled:text-cocoa-soft disabled:shadow-none'

export function ShopScreen() {
  const { state } = useGame()
  const [section, setSection] = useState<Section>('shop')
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const seen = useRef(state.event?.id ?? 0)

  // Confirm purchases with a small toast; every purchase has a new event id.
  useEffect(() => {
    const e = state.event
    if (!e || e.id <= seen.current) return
    seen.current = e.id
    if (e.kind === 'buy') {
      const item = itemById(e.itemId ?? '')
      setToast({ id: e.id, text: `Bought ${e.quantity && e.quantity > 1 ? `${e.quantity} × ` : ''}${item?.name ?? 'an item'}` })
    } else if (e.kind === 'refuse' && e.reason === 'notEnoughCoins') {
      setToast({ id: e.id, text: 'Not enough coins for that yet.' })
    }
  }, [state.event])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-3 pb-28 pt-3 sm:px-6 sm:pt-6 lg:pb-32">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl">
          <Icon name="shop" size={26} className="text-berry" />
          {section === 'shop' ? 'Shop' : 'My bag'}
        </h1>
        <CoinChip coins={state.coins} />
      </header>

      <div role="tablist" aria-label="Shop sections" className="sticker flex w-full max-w-sm gap-1 self-center p-1.5 sm:self-start">
        {(
          [
            ['shop', 'Shop', 'shop'],
            ['bag', 'My bag', 'bag'],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={section === id}
            aria-controls={`panel-${id}`}
            onClick={() => setSection(id)}
            className={`relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-chip)] text-sm font-bold active:scale-95 ${section === id ? 'text-cocoa' : 'text-cocoa-soft'}`}
          >
            {section === id && <motion.span layoutId="shop-section" className="absolute inset-0 rounded-[var(--radius-chip)] bg-blush-soft" transition={springs.settle} />}
            <Icon name={icon} size={18} className="relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          id={`panel-${section}`}
          role="tabpanel"
          aria-labelledby={`tab-${section}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {section === 'shop' ? <ShopPanel /> : <BagPanel onShop={() => setSection('shop')} />}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.p
              key={toast.id}
              className="sticker flex items-center gap-2 px-4 py-2 text-sm font-bold"
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={springs.pop}
            >
              <Icon name="sparkle" size={18} className="text-berry" />
              {toast.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ShopPanel() {
  const [category, setCategory] = useState<ShopCategory>('food')
  const items = SHOP_ITEMS.filter((i) => i.category === category)
  return (
    <section className="sticker stitch overflow-hidden" aria-label="Items for sale">
      {/* Striped awning */}
      <div
        className="h-7"
        style={{
          background: 'repeating-linear-gradient(90deg, #f6b8c6 0 32px, #fffdf9 32px 64px)',
          maskImage: 'radial-gradient(circle at 16px 100%, transparent 9px, #000 10px)',
          maskSize: '32px 100%',
          maskRepeat: 'repeat-x',
          WebkitMaskImage: 'radial-gradient(circle at 16px 100%, transparent 9px, #000 10px)',
          WebkitMaskSize: '32px 100%',
        }}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div role="tablist" aria-label="Categories" className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`min-h-11 rounded-full border-2 px-4 text-sm font-bold active:scale-95 ${
                category === c ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream hover:border-cocoa/25'
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <motion.ul key={category} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" initial="hidden" animate="shown" variants={{ shown: { transition: { staggerChildren: 0.04 } } }}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

function ItemCard({ item }: { item: ShopItem }) {
  const { state, buy } = useGame()
  const [qty, setQty] = useState(1)
  const [pop, setPop] = useState(0)
  const unlocked = isUnlocked(state, item)
  const owned = isOwned(state, item)
  const cost = item.price * (item.category === 'food' ? qty : 1)
  const short = cost - state.coins
  const t = toneClasses[item.tone]
  const lead = activePet(state)

  const purchase = () => {
    buy(item.id, item.category === 'food' ? qty : 1)
    setPop((p) => p + 1)
  }

  return (
    <motion.li
      variants={{ hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0 } }}
      className="flex flex-col gap-3 rounded-[var(--radius-sticker)] bg-cream p-3 shadow-[var(--shadow-base)]"
    >
      <div className="flex items-center gap-3">
        <motion.div
          key={pop}
          className={`relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl ${t.chip} ${t.ink}`}
          animate={pop ? { scale: [1, 1.15, 1], rotate: [0, -6, 0] } : undefined}
          transition={{ duration: 0.4 }}
        >
          {item.category === 'accessories' ? (
            <PetSprite species={lead.species} accessory={item.id} label="" className="w-16 translate-y-2" />
          ) : (
            <Icon name={item.icon} size={34} />
          )}
        </motion.div>
        <div className="min-w-0">
          <h3 className="font-body text-base font-bold leading-tight">{item.name}</h3>
          <p className="text-xs leading-snug text-cocoa-soft">{item.blurb}</p>
          {item.category === 'food' && <p className="mt-0.5 text-xs font-bold text-cocoa-soft">In your bag: {state.inventory[item.id]}</p>}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-bold text-[#b5602b]">
          <Icon name="coin" size={16} />
          {item.price}
          {item.category === 'food' && <span className="font-normal text-cocoa-soft"> each</span>}
        </span>
        {!unlocked ? (
          <span className="flex items-center gap-1 text-xs font-bold text-cocoa-soft">
            <Icon name="sparkle" size={14} />
            {unlockHint(item)}
          </span>
        ) : owned ? (
          <span className="rounded-full bg-mint-soft px-3 py-1 text-xs font-bold text-[#2f7a57]">Owned</span>
        ) : (
          <div className="flex items-center gap-2">
            {item.category === 'food' && (
              <div className="flex items-center rounded-full bg-milk shadow-[var(--shadow-base)]" role="group" aria-label={`How many ${item.name}`}>
                <button type="button" aria-label="One less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-9 place-items-center rounded-full font-bold hover:bg-cocoa/5 active:scale-90">
                  &minus;
                </button>
                <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(10, q + 1))} className="grid size-9 place-items-center rounded-full font-bold hover:bg-cocoa/5 active:scale-90">
                  +
                </button>
              </div>
            )}
            <motion.button type="button" disabled={short > 0} onClick={purchase} whileTap={short > 0 ? undefined : { scale: 0.94 }} transition={springs.pop} className={primary}>
              {short > 0 ? `Need ${short} more` : `Buy for ${cost}`}
            </motion.button>
          </div>
        )}
      </div>
    </motion.li>
  )
}

function BagPanel({ onShop }: { onShop: () => void }) {
  const { state, equip } = useGame()
  const [petId, setPetId] = useState(state.activeId)
  const pet = state.pets.find((p) => p.id === petId) ?? activePet(state)
  const accessories = state.owned.accessories
  const foods = FOOD_ORDER.filter((f) => state.inventory[f] > 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <section className="sticker stitch flex flex-col gap-3 p-4 sm:p-6" aria-labelledby="wardrobe-title">
        <h2 id="wardrobe-title" className="text-xl">
          Wardrobe
        </h2>
        <div role="radiogroup" aria-label="Choose a pet to dress" className="flex flex-wrap gap-2">
          {state.pets.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === pet.id}
              onClick={() => setPetId(p.id)}
              className={`flex min-h-11 items-center gap-1 rounded-full border-2 py-0.5 pl-0.5 pr-3 text-sm font-bold active:scale-95 ${
                p.id === pet.id ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream hover:border-cocoa/25'
              }`}
            >
              <PetSprite species={p.species} accessory={p.accessory} label="" className="w-9" />
              {p.name}
            </button>
          ))}
        </div>
        <div className="grid place-items-center rounded-[var(--radius-sticker)] bg-[radial-gradient(70%_70%_at_50%_70%,#fdeef2,#f8dbe3)] py-4">
          <motion.div key={`${pet.id}-${pet.accessory}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={springs.pop}>
            <PetSprite species={pet.species} mood={pet.accessory ? 'happy' : 'idle'} accessory={pet.accessory} label={`${pet.name}${pet.accessory ? ` wearing the ${itemById(pet.accessory)?.name}` : ''}`} className="w-40" />
          </motion.div>
        </div>
        {accessories.length === 0 ? (
          <Empty text="No accessories yet. Bows, bandanas and crowns are in the shop." onShop={onShop} />
        ) : (
          <div role="radiogroup" aria-label={`What ${pet.name} wears`} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[null, ...accessories].map((a: Accessory | null) => {
              const on = pet.accessory === a
              return (
                <motion.button
                  key={a ?? 'none'}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => equip(pet.id, a)}
                  whileTap={{ scale: 0.94 }}
                  transition={springs.pop}
                  className={`flex min-h-12 items-center gap-1.5 rounded-[var(--radius-chip)] border-2 px-2 text-left text-sm font-bold ${
                    on ? 'border-berry/70 bg-blush-soft' : 'border-cocoa/10 bg-cream hover:border-cocoa/25'
                  }`}
                >
                  {a ? <PetSprite species={pet.species} accessory={a} label="" className="w-8 shrink-0" /> : <span className="grid size-8 shrink-0 place-items-center text-cocoa-soft">&times;</span>}
                  {a ? itemById(a)?.name : 'Nothing'}
                </motion.button>
              )
            })}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-4">
        <section className="sticker stitch p-4 sm:p-6" aria-labelledby="food-title">
          <h2 id="food-title" className="mb-3 text-xl">
            Food
          </h2>
          {foods.length === 0 ? (
            <Empty text="The food bag is empty. Stock up in the shop." onShop={onShop} />
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {foods.map((f) => (
                <li key={f} className="flex items-center gap-2 rounded-[var(--radius-chip)] bg-cream p-2">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${toneClasses[FOODS[f].tone].chip} ${toneClasses[FOODS[f].tone].ink}`}>
                    <Icon name={FOODS[f].icon} size={20} />
                  </span>
                  <span className="min-w-0 text-sm leading-tight">
                    <span className="block truncate font-bold">{FOODS[f].name}</span>
                    <span className="text-cocoa-soft">× {state.inventory[f]}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-cocoa-soft">Use food from the Feed button at home.</p>
        </section>

        <section className="sticker stitch p-4 sm:p-6" aria-labelledby="extras-title">
          <h2 id="extras-title" className="mb-3 text-xl">
            Toys and decor
          </h2>
          {state.owned.toys.length + state.owned.decor.length === 0 ? (
            <Empty text="No toys or decor yet. A feather wand is a great first buy." onShop={onShop} />
          ) : (
            <ul className="flex flex-col gap-2">
              {[...state.owned.toys, ...state.owned.decor].map((id) => {
                const item = itemById(id)!
                return (
                  <li key={id} className="flex items-center gap-2 rounded-[var(--radius-chip)] bg-cream p-2">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${toneClasses[item.tone].chip} ${toneClasses[item.tone].ink}`}>
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span className="text-sm leading-tight">
                      <span className="block font-bold">{item.name}</span>
                      <span className="text-cocoa-soft">{item.category === 'toys' ? 'Find it in Play at home.' : 'Shown in the study room.'}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Empty({ text, onShop }: { text: string; onShop: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-[var(--radius-chip)] bg-cream p-3">
      <p className="text-sm text-cocoa-soft">{text}</p>
      <button type="button" onClick={onShop} className="min-h-11 rounded-full border-2 border-cocoa/15 px-4 text-sm font-bold hover:border-cocoa/30 active:scale-95">
        Go to the shop
      </button>
    </div>
  )
}
