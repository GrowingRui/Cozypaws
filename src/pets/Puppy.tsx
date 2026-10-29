import { motion } from 'motion/react'
import { AccessoryLayer, Cheeks, Eyes, INK, Mouth, OUTLINE, type AccessoryAnchors } from './parts'
import { bodyMotion, earMotion, headMotion, legMotion, tailMotion } from './presets'
import type { RigProps } from './rig'

const FUR = '#f7d8ae'
const PATCH = '#e7b27e'
const EAR = '#d99e6a'
const MUZZLE = '#fff6ea'

const anchors: AccessoryAnchors = { bow: [128, 46], crown: { center: [100, 44], width: 76 }, neck: [100, 128] }

export function Puppy({ mood, blink, accessory }: RigProps) {
  return (
    <motion.g style={{ originX: 0.5, originY: 1 }} {...bodyMotion(mood)}>
      {/* Curly tail, behind the body */}
      <motion.path
        d="M132 160C150 152 160 136 153 123 150 118 143 121 146 128 149 137 140 146 128 150Z"
        fill={FUR}
        {...OUTLINE}
        style={{ originX: 0.05, originY: 0.95 }}
        {...tailMotion(mood, 'wag')}
      />
      <ellipse cx={100} cy={154} rx={40} ry={32} fill={FUR} {...OUTLINE} />
      <ellipse cx={100} cy={162} rx={22} ry={18} fill={MUZZLE} />
      <AccessoryLayer kind={accessory} slot="neck" anchors={anchors} />
      {([[82, 0], [118, 1]] as const).map(([x, phase]) => (
        <motion.g key={x} {...legMotion(mood, phase)}>
          <ellipse cx={x} cy={182} rx={13} ry={9} fill={FUR} {...OUTLINE} />
          <path d={`M${x - 3} 178v5M${x + 3} 178v5`} stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </motion.g>
      ))}

      <motion.g style={{ originX: 0.5, originY: 0.9 }} {...headMotion(mood)}>
        <ellipse cx={100} cy={92} rx={58} ry={50} fill={FUR} {...OUTLINE} />
        <ellipse cx={125} cy={86} rx={16} ry={14} fill={PATCH} />
        <ellipse cx={100} cy={113} rx={23} ry={15} fill={MUZZLE} />
        {/* Floppy ears hang over the sides of the head */}
        <motion.path
          d="M56 60C38 66 32 100 42 114 50 124 62 112 64 96 66 82 66 64 56 60Z"
          fill={EAR}
          {...OUTLINE}
          style={{ originX: 0.6, originY: 0.05 }}
          {...earMotion(mood, 'flop', -1)}
        />
        <motion.path
          d="M144 60C162 66 168 100 158 114 150 124 138 112 136 96 134 82 134 64 144 60Z"
          fill={EAR}
          {...OUTLINE}
          style={{ originX: 0.4, originY: 0.05 }}
          {...earMotion(mood, 'flop', 1)}
        />
        <Eyes mood={mood} blink={blink} left={[78, 92]} right={[122, 92]} lid={FUR} />
        <ellipse cx={100} cy={105} rx={6.5} ry={4.5} fill={INK} />
        <Mouth mood={mood} at={[100, 111]} />
        <Cheeks mood={mood} left={[66, 108]} right={[134, 108]} />
        <AccessoryLayer kind={accessory} slot="head" anchors={anchors} />
      </motion.g>
    </motion.g>
  )
}
