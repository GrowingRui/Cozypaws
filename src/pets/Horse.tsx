import { motion } from 'motion/react'
import { AccessoryLayer, Cheeks, Eyes, INK, Mouth, OUTLINE, type AccessoryAnchors } from './parts'
import { bodyMotion, earMotion, headMotion, legMotion, tailMotion } from './presets'
import type { RigProps } from './rig'

const COAT = '#f6cba4'
const MUZZLE = '#ffe9d6'
const MANE = '#f3a9bc'
const MANE_STREAK = '#cfc3f0'
const HOOF = '#b08a7e'
const INNER_EAR = '#f6b8c6'

const anchors: AccessoryAnchors = { bow: [132, 46], crown: { center: [100, 40], width: 70 }, neck: [100, 136] }

export function Horse({ mood, blink, accessory }: RigProps) {
  return (
    <motion.g style={{ originX: 0.5, originY: 1 }} {...bodyMotion(mood)}>
      {/* Flowing tail */}
      <motion.path
        d="M134 148C158 142 170 160 163 184 158 177 151 171 142 169 148 177 147 183 143 187 134 177 129 162 134 148Z"
        fill={MANE}
        {...OUTLINE}
        style={{ originX: 0.1, originY: 0.05 }}
        {...tailMotion(mood, 'swish')}
      />
      {/* Legs with hooves, stepping in place when walking so the horse keeps facing forward */}
      {([[76, 0], [110, 1]] as const).map(([x, phase]) => (
        <motion.g key={x} style={{ originX: 0.5, originY: 0 }} {...legMotion(mood, phase)}>
          <rect x={x} y={164} width={14} height={25} rx={7} fill={COAT} {...OUTLINE} />
          <path d={`M${x} 181h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5Z`} fill={HOOF} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </motion.g>
      ))}
      <ellipse cx={100} cy={151} rx={40} ry={28} fill={COAT} {...OUTLINE} />
      <AccessoryLayer kind={accessory} slot="neck" anchors={anchors} />

      <motion.g style={{ originX: 0.5, originY: 0.9 }} {...headMotion(mood)}>
        <motion.g style={{ originX: 0.5, originY: 1 }} {...earMotion(mood, 'perk', -1)}>
          <path d="M66 58 60 22 88 44Z" fill={COAT} {...OUTLINE} />
          <path d="M68 50 65 32 80 44Z" fill={INNER_EAR} />
        </motion.g>
        <motion.g style={{ originX: 0.5, originY: 1 }} {...earMotion(mood, 'perk', 1)}>
          <path d="M134 58 140 22 112 44Z" fill={COAT} {...OUTLINE} />
          <path d="M132 50 135 32 120 44Z" fill={INNER_EAR} />
        </motion.g>
        {/* Mane falling down both sides of the neck, so the horse reads as facing forward */}
        <path d="M60 64C40 78 40 104 52 122 58 110 64 100 62 86Z" fill={MANE} {...OUTLINE} />
        <path d="M140 64C160 78 160 104 148 122 142 110 136 100 138 86Z" fill={MANE} {...OUTLINE} />
        <ellipse cx={100} cy={84} rx={50} ry={44} fill={COAT} {...OUTLINE} />
        <ellipse cx={100} cy={118} rx={35} ry={23} fill={MUZZLE} {...OUTLINE} />
        {/* Forelock */}
        <path
          d="M78 48C82 30 99 27 105 36 112 27 128 32 125 48 119 43 113 46 109 51 104 44 96 44 92 53 88 46 83 46 78 48Z"
          fill={MANE}
          {...OUTLINE}
        />
        <path d="M100 34c3 4 4 9 3 14" fill="none" stroke={MANE_STREAK} strokeWidth={4} strokeLinecap="round" />
        <Eyes mood={mood} blink={blink} left={[78, 82]} right={[122, 82]} lid={COAT} lashes />
        <ellipse cx={89} cy={115} rx={2.8} ry={3.8} fill={INK} />
        <ellipse cx={111} cy={115} rx={2.8} ry={3.8} fill={INK} />
        <Mouth mood={mood} at={[100, 126]} />
        <Cheeks mood={mood} left={[62, 98]} right={[138, 98]} />
        <AccessoryLayer kind={accessory} slot="head" anchors={anchors} />
      </motion.g>
    </motion.g>
  )
}
