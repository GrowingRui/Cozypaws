import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * The shoebox diorama: the one bold element in the UI.
 * A thick milk-white frame with an inset room (wall, window, floor, rug).
 * The pet and its reactions are passed in as children and sit on the rug.
 */
type StageProps = {
  children?: ReactNode
  label: string
  night?: boolean
  /** Extra things placed in the room behind the main pet (other pets, the nameplate). */
  scenery?: ReactNode
}

export function Stage({ children, label, night = false, scenery }: StageProps) {
  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-[var(--radius-stage)] bg-milk p-2.5 shadow-[var(--shadow-float)] sm:p-3"
    >
      <div className="relative isolate h-[clamp(17rem,44dvh,30rem)] lg:h-[min(60dvh,32rem)] overflow-hidden rounded-[calc(var(--radius-stage)-0.625rem)] shadow-[inset_0_6px_18px_rgb(74_52_52/0.14)]">
        {/* Wall: soft lavender stripes */}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: 'repeating-linear-gradient(90deg, #ece6fa 0 26px, #e4dcf7 26px 52px)' }}
        />
        {/* Window with drifting clouds */}
        <div className="absolute left-[8%] top-[10%] h-[34%] w-[26%] min-w-24 overflow-hidden rounded-b-2xl rounded-t-[999px] border-[6px] border-milk bg-gradient-to-b from-[#cfe8f6] to-[#f3eaff] shadow-[var(--shadow-base)]">
          <motion.div
            className="absolute top-[28%] h-5 w-14 rounded-full bg-milk/95"
            initial={{ x: '-120%' }}
            animate={{ x: '260%' }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-[58%] h-3.5 w-9 rounded-full bg-milk/80"
            initial={{ x: '-160%' }}
            animate={{ x: '420%' }}
            transition={{ duration: 34, repeat: Infinity, ease: 'linear', delay: 6 }}
          />
          {/* Night sky fades in while the pet sleeps */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-[#3d3a6b] to-[#6b5f9e]"
            initial={false}
            animate={{ opacity: night ? 1 : 0 }}
            transition={{ duration: 1.2 }}
          >
            <span className="absolute right-[18%] top-[16%] size-5 rounded-full bg-[#fff3c4] shadow-[0_0_14px_4px_rgb(255_243_196/0.5)]" />
            <span className="absolute right-[20%] top-[14%] size-4 rounded-full bg-[#3f3c6e]" />
            {(
              [
                ['18%', '22%'],
                ['30%', '58%'],
                ['12%', '70%'],
                ['55%', '40%'],
              ] as const
            ).map(([left, top]) => (
              <span key={left + top} className="absolute size-1 rounded-full bg-milk" style={{ left, top }} />
            ))}
          </motion.div>
          <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 bg-milk" />
          <div className="absolute bottom-0 left-0 h-3 w-full bg-blush-soft" />
        </div>
        {/* Little shelf with a plant */}
        <div className="absolute right-[9%] top-[22%] w-[22%] min-w-20">
          <div className="mx-auto mb-[-2px] flex w-10 items-end justify-center">
            <span className="h-7 w-3 -rotate-12 rounded-full bg-[#9fd4b6]" />
            <span className="h-9 w-3 rounded-full bg-[#8fcaa9]" />
            <span className="h-7 w-3 rotate-12 rounded-full bg-[#9fd4b6]" />
          </div>
          <div className="mx-auto h-6 w-9 rounded-b-xl rounded-t-sm bg-peach" />
          <div className="h-2.5 rounded-full bg-[#f2c9a8] shadow-[var(--shadow-base)]" />
        </div>
        {/* Skirting + floor planks */}
        <div className="absolute inset-x-0 bottom-[30%] h-3 bg-milk" />
        <div
          className="absolute inset-x-0 bottom-0 h-[30%]"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgb(0 0 0 / 0) 0 78px, rgb(181 96 43 / 0.12) 78px 80px), linear-gradient(#ffd9bd, #ffcfae)',
          }}
        />
        {/* Rug */}
        <div className="absolute bottom-[8%] left-1/2 h-[18%] w-[62%] max-w-[26rem] -translate-x-1/2 rounded-[50%] bg-mint shadow-[inset_0_0_0_6px_rgb(255_255_255/0.55)]" />
        {/* Night: the room dims and a warm lamp glow pools around the pet */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(42% 46% at 50% 78%, rgb(255 196 140 / 0.45), transparent 70%), linear-gradient(rgb(52 42 92 / 0.5), rgb(74 52 72 / 0.42))',
          }}
          initial={false}
          animate={{ opacity: night ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        />
        {/* Pet slot */}
        {/* Pets stay bright above the night dimming, so they remain the focus */}
        {scenery}
        {/* Only the pet itself takes clicks, so pets elsewhere in the room stay tappable */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[12%] flex justify-center [&>*]:pointer-events-auto">{children}</div>
      </div>
    </section>
  )
}
