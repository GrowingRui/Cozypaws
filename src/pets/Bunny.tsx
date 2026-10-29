import { motion } from 'motion/react'
import { AccessoryLayer, Cheeks, Eyes, INK, Mouth, NOSE_PINK, OUTLINE, type AccessoryAnchors } from './parts'
import { bodyMotion, earMotion, headMotion, legMotion, tailMotion } from './presets'
import type { RigProps } from './rig'

const FUR = '#fffdf9'
const INNER_EAR = '#f6b8c6'
const SHADE = '#f1e7dc'

const anchors: AccessoryAnchors = { bow: [122, 58], crown: { center: [100, 54], width: 70 }, neck: [100, 134] }

export function Bunny({ mood, blink, accessory }: RigProps) {
  return (
    <motion.g style={{ originX: 0.5, originY: 1 }} {...bodyMotion(mood)}>
      {/* Pom-pom tail peeks out at the side */}
      <motion.circle cx={141} cy={168} r={13} fill={FUR} {...OUTLINE} style={{ originX: 0.5, originY: 0.5 }} {...tailMotion(mood, 'puff')} />
      {/* Big back feet */}
      <ellipse cx={64} cy={184} rx={17} ry={8} fill={FUR} {...OUTLINE} />
      <ellipse cx={136} cy={184} rx={17} ry={8} fill={FUR} {...OUTLINE} />
      <ellipse cx={100} cy={157} rx={38} ry={31} fill={FUR} {...OUTLINE} />
      <ellipse cx={100} cy={165} rx={20} ry={16} fill={SHADE} />
      <AccessoryLayer kind={accessory} slot="neck" anchors={anchors} />
      {([[86, 0], [114, 1]] as const).map(([x, phase]) => (
        <motion.g key={x} {...legMotion(mood, phase)}>
          <ellipse cx={x} cy={184} rx={11} ry={8} fill={FUR} {...OUTLINE} />
        </motion.g>
      ))}

      <motion.g style={{ originX: 0.5, originY: 0.9 }} {...headMotion(mood)}>
        {/* Tall ears pivot from their base */}
        <motion.g style={{ originX: 0.5, originY: 1 }} {...earMotion(mood, 'tall', -1)}>
          <path d="M80 64C66 42 63 8 76 4 90 0 95 36 92 64Z" fill={FUR} {...OUTLINE} />
          <path d="M82 57C73 39 72 15 78 12 85 10 88 36 87 57Z" fill={INNER_EAR} />
        </motion.g>
        <motion.g style={{ originX: 0.5, originY: 1 }} {...earMotion(mood, 'tall', 1)}>
          <path d="M120 64C134 42 137 8 124 4 110 0 105 36 108 64Z" fill={FUR} {...OUTLINE} />
          <path d="M118 57C127 39 128 15 122 12 115 10 112 36 113 57Z" fill={INNER_EAR} />
        </motion.g>
        <ellipse cx={100} cy={99} rx={56} ry={47} fill={FUR} {...OUTLINE} />
        <Eyes mood={mood} blink={blink} left={[78, 99]} right={[122, 99]} lid={FUR} />
        {/* Twitchy nose */}
        <motion.ellipse
          cx={100}
          cy={108}
          rx={4.5}
          ry={3.2}
          fill={NOSE_PINK}
          stroke={INK}
          strokeWidth={2}
          style={{ originX: 0.5, originY: 0.5 }}
          animate={mood === 'sleeping' ? { scaleX: 1, y: 0 } : { scaleX: [1, 1.25, 1, 1.25, 1, 1], y: [0, -1, 0, -1, 0, 0] }}
          transition={mood === 'sleeping' ? { duration: 0.3 } : { duration: 2.6, repeat: Infinity, times: [0, 0.06, 0.12, 0.18, 0.24, 1] }}
        />
        <Mouth mood={mood} at={[100, 113]} />
        {mood !== 'happy' && mood !== 'excited' && mood !== 'eating' && (
          <path d="M96.5 118.5h7v4.5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5ZM100 118.5v6" fill="#fff" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        )}
        <Cheeks mood={mood} left={[66, 113]} right={[134, 113]} />
        <AccessoryLayer kind={accessory} slot="head" anchors={anchors} />
      </motion.g>
    </motion.g>
  )
}
