import { motion } from 'motion/react'
import { AccessoryLayer, Cheeks, Eyes, INK, Mouth, NOSE_PINK, OUTLINE, type AccessoryAnchors } from './parts'
import { bodyMotion, earMotion, headMotion, legMotion, tailMotion } from './presets'
import type { RigProps } from './rig'

const FUR = '#e8e2f4'
const STRIPE = '#c4b8e4'
const INNER_EAR = '#f6b8c6'
const BELLY = '#fffdf9'

const anchors: AccessoryAnchors = { bow: [134, 54], crown: { center: [100, 48], width: 72 }, neck: [100, 130] }
const TAIL = 'M126 172C160 174 170 150 159 132 152 120 160 106 172 109'

export function Kitten({ mood, blink, accessory }: RigProps) {
  return (
    <motion.g style={{ originX: 0.5, originY: 1 }} {...bodyMotion(mood)}>
      {/* Long tail drawn as a double stroke so it keeps the outline style */}
      <motion.g style={{ originX: 0, originY: 1 }} {...tailMotion(mood, 'swish')}>
        <path d={TAIL} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
        <path d={TAIL} fill="none" stroke={FUR} strokeWidth={10} strokeLinecap="round" />
        <path d="M160 128c4 2 8 2 11 0M156 145c4 2 8 1 10-1" fill="none" stroke={STRIPE} strokeWidth={3} strokeLinecap="round" />
      </motion.g>
      <ellipse cx={100} cy={155} rx={38} ry={31} fill={FUR} {...OUTLINE} />
      <ellipse cx={100} cy={163} rx={20} ry={17} fill={BELLY} />
      <AccessoryLayer kind={accessory} slot="neck" anchors={anchors} />
      {([[84, 0], [116, 1]] as const).map(([x, phase]) => (
        <motion.g key={x} {...legMotion(mood, phase)}>
          <ellipse cx={x} cy={183} rx={12} ry={8.5} fill={BELLY} {...OUTLINE} />
        </motion.g>
      ))}

      <motion.g style={{ originX: 0.5, originY: 0.9 }} {...headMotion(mood)}>
        {/* Pointed ears sit behind the head */}
        <motion.g style={{ originX: 0.5, originY: 1 }} {...earMotion(mood, 'perk', -1)}>
          <path d="M54 72 48 24 88 52Z" fill={FUR} {...OUTLINE} />
          <path d="M58 62 55 37 77 52Z" fill={INNER_EAR} />
        </motion.g>
        <motion.g style={{ originX: 0.5, originY: 1 }} {...earMotion(mood, 'perk', 1)}>
          <path d="M146 72 152 24 112 52Z" fill={FUR} {...OUTLINE} />
          <path d="M142 62 145 37 123 52Z" fill={INNER_EAR} />
        </motion.g>
        <ellipse cx={100} cy={95} rx={58} ry={48} fill={FUR} {...OUTLINE} />
        <path d="M92 50v10M100 48v13M108 50v10" stroke={STRIPE} strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={100} cy={113} rx={17} ry={10} fill={BELLY} />
        <Eyes mood={mood} blink={blink} left={[77, 96]} right={[123, 96]} r={8} lid={FUR} />
        <path d="M95.5 105h9l-4.5 4.5Z" fill={NOSE_PINK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <Mouth mood={mood} at={[100, 111]} />
        <path
          d="M38 103l19 4M38 114l19-1M162 103l-19 4M162 114l-19-1"
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.7}
        />
        <Cheeks mood={mood} left={[65, 111]} right={[135, 111]} />
        <AccessoryLayer kind={accessory} slot="head" anchors={anchors} />
      </motion.g>
    </motion.g>
  )
}
