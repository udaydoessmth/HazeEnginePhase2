/**
 * LogoMark.jsx
 * Vector emblem for HazeEngine (H monogram + audio frequency / story node).
 */
export default function LogoMark({ size = 26, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="haze-mark-bg" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1c1c1f" />
          <stop offset="1" stopColor="#0d0d0f" />
        </linearGradient>
        <linearGradient id="haze-mark-accent" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#d4d4d8" />
        </linearGradient>
      </defs>
      {/* Background Plate */}
      <rect width="32" height="32" rx="7.5" fill="url(#haze-mark-bg)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="rgba(255,255,255,0.18)" />

      {/* Left Pillar */}
      <rect x="7" y="7.5" width="3" height="17" rx="1.5" fill="url(#haze-mark-accent)" />

      {/* Right Pillar */}
      <rect x="22" y="7.5" width="3" height="17" rx="1.5" fill="url(#haze-mark-accent)" />

      {/* Connecting Crossbar */}
      <rect x="8.5" y="14.5" width="15" height="3" rx="1.5" fill="#ffffff" />

      {/* Center Equalizer Wave / Story Node */}
      <rect x="14.75" y="9.5" width="2.5" height="13" rx="1.25" fill="#ffffff" />
      <circle cx="16" cy="16" r="2.2" fill="#0d0d0f" />
      <circle cx="16" cy="16" r="1.1" fill="#ffffff" />
    </svg>
  )
}
