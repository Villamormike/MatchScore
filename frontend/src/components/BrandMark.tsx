import { useId } from 'react'

type BrandMarkProps = {
  variant?: 'default' | 'light'
  className?: string
}

export function BrandMark({ variant = 'default', className = '' }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '')
  const bgId = `ms-bg-${uid}`
  const glowId = `ms-glow-${uid}`
  const isLight = variant === 'light'

  const classes = [
    'brand-mark',
    isLight ? 'brand-mark--light' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-hidden="true">
      <svg className="brand-mark-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {isLight ? (
            <>
              <linearGradient id={bgId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dff7f2" />
              </linearGradient>
              <radialGradient id={glowId} cx="25" cy="7" r="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0e9c8e" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0e9c8e" stopOpacity="0" />
              </radialGradient>
            </>
          ) : (
            <>
              <linearGradient id={bgId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#12b3a3" />
                <stop offset="52%" stopColor="#0e9c8e" />
                <stop offset="100%" stopColor="#07635c" />
              </linearGradient>
              <radialGradient id={glowId} cx="25" cy="7" r="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7affec" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#7affec" stopOpacity="0" />
              </radialGradient>
            </>
          )}
        </defs>
        <rect width="32" height="32" rx="8.5" fill={`url(#${bgId})`} />
        <circle cx="25" cy="7" r="10" fill={`url(#${glowId})`} />
        <rect
          x="0.75"
          y="0.75"
          width="30.5"
          height="30.5"
          rx="7.75"
          stroke={isLight ? '#0e9c8e' : '#ffffff'}
          strokeOpacity={isLight ? '0.24' : '0.18'}
          strokeWidth="1"
        />
        <rect
          x="6"
          y="5.5"
          width="14.5"
          height="18.5"
          rx="3.2"
          fill={isLight ? '#096e67' : '#ffffff'}
        />
        <rect
          x="9"
          y="9"
          width="8.5"
          height="2.1"
          rx="1.05"
          fill={isLight ? '#ffffff' : '#096e67'}
        />
        <rect
          x="9"
          y="12.8"
          width="6.5"
          height="1.8"
          rx="0.9"
          fill={isLight ? '#9cefe5' : '#0e9c8e'}
          fillOpacity={isLight ? '0.9' : '0.82'}
        />
        <rect
          x="9"
          y="16.2"
          width="4.6"
          height="1.8"
          rx="0.9"
          fill={isLight ? '#9cefe5' : '#0e9c8e'}
          fillOpacity={isLight ? '0.6' : '0.48'}
        />
        <circle cx="21" cy="20.5" r="7.3" fill={isLight ? '#e9faf6' : '#07635c'} />
        <circle
          cx="21"
          cy="20.5"
          r="5.6"
          fill={isLight ? '#0b877c' : '#097970'}
          stroke={isLight ? '#096e67' : '#ffffff'}
          strokeOpacity="0.22"
          strokeWidth="1.8"
        />
        <path
          d="M21 14.9 A 5.6 5.6 0 1 1 15.7 22.3"
          stroke="#64f5e2"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M18.7 20.5 L20.3 22.1 L23.5 18.8"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24.8 5.2 C24.8 7.2 25.4 7.8 27.4 8.2 C25.4 8.6 24.8 9.2 24.8 11.2 C24.8 9.2 24.2 8.6 22.2 8.2 C24.2 7.8 24.8 7.2 24.8 5.2 Z"
          fill={isLight ? '#0e9c8e' : '#83fff0'}
        />
      </svg>
    </span>
  )
}

export default BrandMark
