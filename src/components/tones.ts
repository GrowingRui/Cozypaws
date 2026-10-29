/** Pastel tones shared by stickers, stat bars and buttons. Text on every tone stays cocoa for contrast. */
export type Tone = 'blush' | 'lavender' | 'mint' | 'peach' | 'berry'

export const toneClasses: Record<Tone, { chip: string; fill: string; track: string; ink: string }> = {
  blush: { chip: 'bg-blush-soft', fill: 'bg-blush', track: 'bg-blush-soft', ink: 'text-berry' },
  lavender: { chip: 'bg-lavender-soft', fill: 'bg-lavender', track: 'bg-lavender-soft', ink: 'text-[#6a55a8]' },
  mint: { chip: 'bg-mint-soft', fill: 'bg-mint', track: 'bg-mint-soft', ink: 'text-[#2f7a57]' },
  peach: { chip: 'bg-peach-soft', fill: 'bg-peach', track: 'bg-peach-soft', ink: 'text-[#b5602b]' },
  berry: { chip: 'bg-blush-soft', fill: 'bg-berry', track: 'bg-blush-soft', ink: 'text-berry' },
}

/** Spring presets: "pop" for taps and reactions, "settle" for bars and layout. */
export const springs = {
  pop: { type: 'spring', stiffness: 520, damping: 22, mass: 0.7 },
  settle: { type: 'spring', stiffness: 180, damping: 24 },
} as const
