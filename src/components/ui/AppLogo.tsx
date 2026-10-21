interface AppLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
}

export default function AppLogo({
  className = '',
  size = 40,
  showText = false,
  textColor = '#202B3C',
  subtextColor = '#697586',
}: AppLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official HadirKu App Icon (Squircle with Shield & QR Checkmark) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        <defs>
          {/* Main Body Gradient */}
          <linearGradient id="logoBgGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#243B64" />
            <stop offset="100%" stopColor="#16243D" />
          </linearGradient>

          {/* Accent Teal Gradient */}
          <linearGradient id="logoTealGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4FA4C7" />
            <stop offset="100%" stopColor="#3B82A0" />
          </linearGradient>

          {/* Inner Light Glow */}
          <linearGradient id="logoGlow" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Squircle Base Frame */}
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="16"
          fill="url(#logoBgGrad)"
          stroke="#324B75"
          strokeWidth="1.5"
        />

        {/* Subtle Top Inner Highlight */}
        <path
          d="M 17 2 L 47 2 C 55.8 2 62 8.2 62 17 L 62 25 C 50 18 35 18 2 24 L 2 17 C 2 8.2 8.2 2 17 2 Z"
          fill="url(#logoGlow)"
          opacity="0.3"
        />

        {/* QR Scanner Target Brackets (Corner Anchors) */}
        <path
          d="M 18 24 L 18 18 L 24 18"
          stroke="#3B82A0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 46 24 L 46 18 L 40 18"
          stroke="#3B82A0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 18 40 L 18 46 L 24 46"
          stroke="#3B82A0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 46 40 L 46 46 L 40 46"
          stroke="#3B82A0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Stylized "H" intertwined with Attendance Checkmark */}
        {/* Left Vertical Pillar */}
        <rect x="23" y="24" width="4" height="16" rx="2" fill="#FFFFFF" />

        {/* Right Vertical Pillar */}
        <rect x="37" y="24" width="4" height="16" rx="2" fill="#FFFFFF" />

        {/* Crossbar with Verified Checkmark Extension */}
        <path
          d="M 23 32 L 39 32"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Dynamic Verified Badge / Checkmark Tip in Accent Teal */}
        <circle cx="43" cy="23" r="4.5" fill="#10B981" stroke="#16243D" strokeWidth="1.5" />
        <path
          d="M 41.5 23 L 42.8 24.3 L 45 22"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Brand Title and Subtitle */}
      {showText && (
        <div className="leading-tight text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold text-base tracking-tight font-sans"
              style={{ color: textColor }}
            >
              HadirKu
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#3B82A0]/15 text-[#3B82A0] border border-[#3B82A0]/20">
              v1.0
            </span>
          </div>
          <span
            className="text-xs font-medium block mt-0.5"
            style={{ color: subtextColor }}
          >
            Presensi Digital Sekolah
          </span>
        </div>
      )}
    </div>
  );
}
