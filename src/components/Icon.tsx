import type { SVGProps } from 'react'

/**
 * Hand-drawn style icon set: 24px grid, 2px rounded strokes, soft fills.
 * Fills use currentColor at low opacity so icons tint with their sticker.
 */
export type IconName =
  | 'bowl'
  | 'hand'
  | 'yarn'
  | 'ball'
  | 'moon'
  | 'sun'
  | 'home'
  | 'paw'
  | 'bag'
  | 'shop'
  | 'coin'
  | 'heart'
  | 'bolt'
  | 'leaf'
  | 'drumstick'
  | 'sparkle'
  | 'dice'
  | 'cup'
  | 'cake'
  | 'feather'
  | 'bubbles'
  | 'lights'
  | 'hanger'
  | 'book'
  | 'pause'
  | 'play'
  | 'cookie'
  | 'carrot'
  | 'chevronLeft'
  | 'chevronRight'
  | 'restart'
  | 'sound'
  | 'soundOff'
  | 'sliders'
  | 'check'
  | 'suitcase'

const paths: Record<IconName, React.ReactNode> = {
  cookie: (
    <>
      <path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z" fill="currentColor" fillOpacity=".22" />
      <path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z" />
      <circle cx="10.5" cy="11" r=".9" fill="currentColor" />
      <circle cx="13.6" cy="12.4" r=".9" fill="currentColor" />
    </>
  ),
  carrot: (
    <>
      <path d="M14.5 9.5c1.4 1.4 1.4 3.5 0 5L6.3 20.6c-.8.6-1.9-.5-1.3-1.3l6.1-8.2c1.4-1.4 3.6-1.4 5 0Z" fill="currentColor" fillOpacity=".22" />
      <path d="M14.5 9.5c1.4 1.4 1.4 3.5 0 5L6.3 20.6c-.8.6-1.9-.5-1.3-1.3l6.1-8.2c1.4-1.4 3.6-1.4 5 0Z" />
      <path d="M15 9c.5-2 2-3.5 4.5-4M15 9c2-.3 3.8.3 5 1.8M15 9c-.2-2.2.5-4 2-5.5M9.5 14.5l1.5 1.5M8 17l1 1" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 1 4 18Z" fill="currentColor" fillOpacity=".2" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 0 20 18Z" fill="currentColor" fillOpacity=".1" />
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a1 1 0 0 1 1 1v15a1.5 1.5 0 0 0-1.5-1.5H4ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13a1 1 0 0 0-1 1v15a1.5 1.5 0 0 1 1.5-1.5H20Z" />
      <path d="M7 8h2M15 8h2" />
    </>
  ),
  pause: <path d="M9 6v12M15 6v12" strokeWidth={3} />,
  play: <path d="M8 5.5v13l10-6.5Z" fill="currentColor" fillOpacity=".25" />,
  cup: (
    <>
      <path d="M6 8h12l-1.3 11.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3Z" fill="currentColor" fillOpacity=".22" />
      <path d="M6 8h12l-1.3 11.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3ZM5 8h14M13 8l2-5h3" />
      <circle cx="10.5" cy="13" r="1" fill="currentColor" />
      <circle cx="13.5" cy="15.5" r="1" fill="currentColor" />
    </>
  ),
  cake: (
    <>
      <path d="M4 13h16v6a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z" fill="currentColor" fillOpacity=".22" />
      <path d="M4 13h16v6a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19ZM4 13c0-2 1.5-3 3-3h10c1.5 0 3 1 3 3M4 15.5c2 1.3 4 1.3 5.3 0 1.4 1.3 4 1.3 5.4 0 1.3 1.3 3.3 1.3 5.3 0M12 10V7" />
      <path d="M12 3.5c1 1.2 1 2.2 0 3-1-.8-1-1.8 0-3Z" fill="currentColor" />
    </>
  ),
  feather: (
    <>
      <path d="M19 4c-7 0-12 5-12 11v4l3-3c6 0 9-6 9-12Z" fill="currentColor" fillOpacity=".22" />
      <path d="M19 4c-7 0-12 5-12 11v4l3-3c6 0 9-6 9-12ZM4 21l9-9M11 11h4M9 14h4" />
    </>
  ),
  bubbles: (
    <>
      <circle cx="9" cy="14" r="5.5" fill="currentColor" fillOpacity=".18" />
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="17" cy="7" r="3.5" />
      <circle cx="18" cy="16" r="2" />
      <path d="M6.5 12a3 3 0 0 1 2.5-1.5" />
    </>
  ),
  lights: (
    <>
      <path d="M3 5c4 4 14 4 18 0" />
      {[5.5, 10, 14, 18.5].map((x, i) => (
        <path key={x} d={`M${x} ${i === 0 || i === 3 ? 7 : 8.3}v1.5`} />
      ))}
      {[5.5, 10, 14, 18.5].map((x, i) => (
        <ellipse key={`b${x}`} cx={x} cy={i === 0 || i === 3 ? 11 : 12.3} rx="1.8" ry="2.4" fill="currentColor" fillOpacity=".3" />
      ))}
    </>
  ),
  hanger: (
    <>
      <path d="M12 8.5V7.5a2 2 0 1 0-2-2" />
      <path d="M12 8.5 3.5 15a1.6 1.6 0 0 0 1 2.9h15a1.6 1.6 0 0 0 1-2.9Z" fill="currentColor" fillOpacity=".18" />
      <path d="M12 8.5 3.5 15a1.6 1.6 0 0 0 1 2.9h15a1.6 1.6 0 0 0 1-2.9Z" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="currentColor" fillOpacity=".18" />
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" />
      <circle cx="9" cy="15" r="1.1" fill="currentColor" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth={2.8} />,
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" strokeWidth={2.6} />,
  chevronRight: <path d="M9.5 5.5 16 12l-6.5 6.5" strokeWidth={2.6} />,
  suitcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" fill="currentColor" fillOpacity=".18" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17" />
    </>
  ),
  restart: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M6.5 3v4h4" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4Z" fill="currentColor" fillOpacity=".18" />
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4Z" fill="currentColor" fillOpacity=".18" />
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4Z" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7.5h16M4 16.5h16" />
      <circle cx="9" cy="7.5" r="2.4" fill="var(--color-milk)" />
      <circle cx="15" cy="16.5" r="2.4" fill="var(--color-milk)" />
    </>
  ),
  bowl: (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" fill="currentColor" fillOpacity=".18" />
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" />
      <circle cx="9" cy="8.5" r="1.6" />
      <circle cx="13" cy="7.5" r="1.6" />
      <circle cx="15.5" cy="9.5" r="1.4" />
    </>
  ),
  hand: (
    <>
      <path
        d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v5.5m0-3a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6.5 6.5 0 0 1-5.3-2.7L4 15.2a1.6 1.6 0 0 1 2.4-2.1L7 13.7"
        fill="currentColor"
        fillOpacity=".14"
      />
    </>
  ),
  yarn: (
    <>
      <circle cx="11" cy="11" r="7.5" fill="currentColor" fillOpacity=".18" />
      <circle cx="11" cy="11" r="7.5" />
      <path d="M5 7.5c3.5 0 9 3 11.5 8M4.6 12.5c3 0 6.5 2.3 8 5.8M9 3.8c1.5 2.5 6.5 4 9.4 3.4" />
      <path d="M17 17c1.5 1.6 2.5 2.4 4 2.5" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity=".18" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M4.5 8.5c4 2 11 2 15 0M4.5 15.5c4-2 11-2 15 0" />
    </>
  ),
  moon: (
    <>
      <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10Z" fill="currentColor" fillOpacity=".18" />
      <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10Z" />
      <path d="M16 4.5v3M14.5 6h3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity=".2" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4.5l8 6.5v8.5a1 1 0 0 1-1 1h-4.5V15h-5v5.5H5a1 1 0 0 1-1-1Z" fill="currentColor" fillOpacity=".18" />
      <path d="M4 11 12 4.5l8 6.5v8.5a1 1 0 0 1-1 1h-4.5V15h-5v5.5H5a1 1 0 0 1-1-1Z" />
    </>
  ),
  paw: (
    <>
      <path d="M12 12.5c3 0 5.5 3 5.5 5.2 0 1.6-1.2 2.3-2.6 2.3-1.1 0-1.8-.6-2.9-.6s-1.8.6-2.9.6c-1.4 0-2.6-.7-2.6-2.3 0-2.2 2.5-5.2 5.5-5.2Z" fill="currentColor" fillOpacity=".2" />
      <path d="M12 12.5c3 0 5.5 3 5.5 5.2 0 1.6-1.2 2.3-2.6 2.3-1.1 0-1.8-.6-2.9-.6s-1.8.6-2.9.6c-1.4 0-2.6-.7-2.6-2.3 0-2.2 2.5-5.2 5.5-5.2Z" />
      <ellipse cx="5.5" cy="10" rx="1.8" ry="2.3" />
      <ellipse cx="18.5" cy="10" rx="1.8" ry="2.3" />
      <ellipse cx="9" cy="5.8" rx="1.7" ry="2.3" />
      <ellipse cx="15" cy="5.8" rx="1.7" ry="2.3" />
    </>
  ),
  bag: (
    <>
      <path d="M5 9h14l-1 10.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5Z" fill="currentColor" fillOpacity=".18" />
      <path d="M5 9h14l-1 10.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </>
  ),
  shop: (
    <>
      <path d="M5 11v8.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V11" />
      <path d="M3.5 9 5.5 4h13l2 5a2.6 2.6 0 0 1-4.3 2 2.6 2.6 0 0 1-4.2 0 2.6 2.6 0 0 1-4.2 0A2.6 2.6 0 0 1 3.5 9Z" fill="currentColor" fillOpacity=".2" />
      <path d="M3.5 9 5.5 4h13l2 5a2.6 2.6 0 0 1-4.3 2 2.6 2.6 0 0 1-4.2 0 2.6 2.6 0 0 1-4.2 0A2.6 2.6 0 0 1 3.5 9Z" />
      <path d="M10 20.5V16h4v4.5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity=".25" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.5 9.3c-.5-.8-1.4-1.3-2.5-1.3-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.5-2.5-1.3" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="currentColor" fillOpacity=".22" />
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    </>
  ),
  bolt: (
    <>
      <path d="M13.5 3 5.5 13.5h6L10.5 21l8-10.5h-6Z" fill="currentColor" fillOpacity=".22" />
      <path d="M13.5 3 5.5 13.5h6L10.5 21l8-10.5h-6Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10 10 5 20 4c0 9-5 15-13 15" fill="currentColor" fillOpacity=".2" />
      <path d="M5 19C5 10 10 5 20 4c0 9-5 15-13 15" />
      <path d="M4 20c3-4 6.5-7.5 11-10.5" />
    </>
  ),
  drumstick: (
    <>
      <path d="M15.5 3.5a5 5 0 0 1 5 5c0 3.6-3.8 5.8-6.8 7l-2.2-2.2-2.2-2.2c1.2-3 3.4-6.8 7-6.8Z" fill="currentColor" fillOpacity=".22" />
      <path d="M15.5 3.5a5 5 0 0 1 5 5c0 3.6-3.8 5.8-6.8 7l-2.2-2.2-2.2-2.2c1.2-3 3.4-6.8 7-6.8Z" />
      <path d="m10.3 13.5-4 4M6.3 17.5a1.8 1.8 0 1 1-2.3 2.6 1.8 1.8 0 0 1-.4-2.8 1.8 1.8 0 0 1 2.7.2Z" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" fill="currentColor" fillOpacity=".25" />
      <path d="M12 3c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" />
      <path d="M19 16.5v4M17 18.5h4" />
    </>
  ),
}

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number }

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
