export default function DrAriaIllustration({ size = 'lg' }) {
  const dims =
    size === 'sm'
      ? 'w-14 h-14 sm:w-16 sm:h-16'
      : size === 'md'
      ? 'w-28 h-28 sm:w-32 sm:h-32'
      : 'w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56';

  return (
    <div className={`relative flex items-center justify-center select-none ${dims}`}>
      {/* Soft Holographic Ambient Halo */}
      <div
        className="hidden sm:block absolute inset-1 rounded-full blur-xl opacity-60 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.34) 0%, rgba(225,29,72,0.22) 58%, transparent 80%)',
        }}
      />

      <svg
        viewBox="0 0 220 230"
        className="w-full h-full relative z-10 aria-float overflow-visible"
        role="img"
        aria-label="Dr. Aria — HemoSync AI Medical Guide"
      >
        <defs>
          <linearGradient id="ariaBgCircle" x1="30" y1="20" x2="190" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f2347" />
            <stop offset="100%" stopColor="#071024" />
          </linearGradient>
          <linearGradient id="ariaHair" x1="70" y1="25" x2="150" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="ariaSkin" x1="90" y1="55" x2="130" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5c6a5" />
            <stop offset="100%" stopColor="#e5a47e" />
          </linearGradient>
          <linearGradient id="ariaCoat" x1="55" y1="120" x2="165" y2="215" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="ariaScrubs" x1="90" y1="125" x2="130" y2="185" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="ariaTablet" x1="70" y1="150" x2="150" y2="205" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id="ariaDrop" x1="110" y1="162" x2="110" y2="192" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Outer Hologram Ring */}
        <circle
          cx="110"
          cy="115"
          r="98"
          fill="url(#ariaBgCircle)"
          stroke="rgba(56,189,248,0.45)"
          strokeWidth="2"
        />
        <circle
          cx="110"
          cy="115"
          r="105"
          fill="none"
          stroke="rgba(56,189,248,0.35)"
          strokeWidth="1.2"
          strokeDasharray="10 7"
          className="orbit-spin-slow"
        />

        {/* Back Hair Silhouette */}
        <path
          d="M66 95 C64 52, 82 32, 110 32 C138 32, 156 52, 154 95 C154 115, 146 126, 138 128 L82 128 C74 126, 66 115, 66 95 Z"
          fill="url(#ariaHair)"
        />
        {/* Sleek Ponytail */}
        <path
          d="M142 54 C162 56, 168 82, 158 106 C152 100, 146 88, 144 74 Z"
          fill="#0f172a"
        />

        {/* Shoulders & Medical Coat */}
        <path
          d="M46 202 C50 154, 72 132, 110 132 C148 132, 170 154, 174 202 C156 212, 134 217, 110 217 C86 217, 64 212, 46 202 Z"
          fill="url(#ariaCoat)"
        />

        {/* Inner Medical Scrubs V-Neck */}
        <path
          d="M93 132 L127 132 L120 176 L100 176 Z"
          fill="url(#ariaScrubs)"
        />

        {/* Coat Lapels */}
        <path d="M93 132 L78 148 L96 172 Z" fill="#e2e8f0" />
        <path d="M127 132 L142 148 L124 172 Z" fill="#e2e8f0" />

        {/* Neck */}
        <path
          d="M99 112 L121 112 L122 135 C115 140, 105 140, 98 135 Z"
          fill="#e29e78"
        />

        {/* Stethoscope Tubing */}
        <path
          d="M84 132 C76 154, 84 172, 102 174 M136 132 C144 154, 136 172, 118 174"
          fill="none"
          stroke="#334155"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="84" cy="133" r="3" fill="#94a3b8" />
        <circle cx="136" cy="133" r="3" fill="#94a3b8" />

        {/* AI ID Badge */}
        <rect x="134" y="152" width="16" height="11" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="139" cy="157.5" r="2" fill="#f43f5e" />
        <line x1="143" y1="156" x2="148" y2="156" stroke="#38bdf8" strokeWidth="1.2" />
        <line x1="143" y1="159" x2="147" y2="159" stroke="#94a3b8" strokeWidth="1" />

        {/* Ears & Cyber-Medical Earpiece */}
        <circle cx="75" cy="88" r="6" fill="#e5a47e" />
        <circle cx="145" cy="88" r="6" fill="#e5a47e" />
        <circle cx="147" cy="89" r="3.4" fill="#38bdf8" />
        <circle cx="147" cy="89" r="1.4" fill="#ffffff" />

        {/* Head / Face */}
        <path
          d="M76 80 C76 54, 91 44, 110 44 C129 44, 144 54, 144 80 C144 104, 128 119, 110 119 C92 119, 76 104, 76 80 Z"
          fill="url(#ariaSkin)"
        />

        {/* Sculpted Front Hair Fringe */}
        <path
          d="M74 78 C75 48, 92 36, 112 36 C133 36, 146 50, 146 76 C138 62, 127 56, 115 57 C101 58, 90 66, 74 78 Z"
          fill="url(#ariaHair)"
        />
        {/* Subtle Hair Shine */}
        <path
          d="M88 49 C100 43, 118 43, 129 50"
          fill="none"
          stroke="rgba(148,163,184,0.38)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Eyebrows */}
        <path d="M88 73 Q95 69 102 72" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M118 72 Q125 69 132 73" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />

        {/* Expressive Eyes */}
        <ellipse cx="95" cy="82" rx="4.6" ry="5" fill="#0f172a" />
        <ellipse cx="125" cy="82" rx="4.6" ry="5" fill="#0f172a" />
        <circle cx="96.6" cy="80.3" r="1.6" fill="#ffffff" />
        <circle cx="126.6" cy="80.3" r="1.6" fill="#ffffff" />

        {/* Subtle Cheek Warmth */}
        <ellipse cx="87" cy="92" rx="5.5" ry="2.8" fill="#fb7185" opacity="0.24" />
        <ellipse cx="133" cy="92" rx="5.5" ry="2.8" fill="#fb7185" opacity="0.24" />

        {/* Gentle Nose & Warm Smile */}
        <path d="M110 84 L108.5 92 L111.5 93" fill="none" stroke="#c9805b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 100 Q110 108 120 100" fill="none" stroke="#9f1239" strokeWidth="2.4" strokeLinecap="round" />

        {/* Holographic Medical Tablet Held in Front */}
        <g>
          <rect
            x="64"
            y="152"
            width="92"
            height="54"
            rx="9"
            fill="url(#ariaTablet)"
            stroke="#38bdf8"
            strokeWidth="1.6"
            style={{ filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.45))' }}
          />
          {/* Tablet Screen Content: Blood Drop + ECG Pulse + Live Bars */}
          <path
            d="M84 164 C84 164 75 174 75 181 A9 9 0 0 0 93 181 C93 174 84 164 84 164 Z"
            fill="url(#ariaDrop)"
          />
          <path
            d="M99 179 L106 179 L110 170 L114 188 L118 175 L122 179 L144 179"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="75" y="195" width="28" height="4" rx="2" fill="#38bdf8" opacity="0.85" />
          <rect x="108" y="195" width="18" height="4" rx="2" fill="#fbbf24" opacity="0.85" />
          <rect x="131" y="195" width="14" height="4" rx="2" fill="#34d399" opacity="0.85" />

          {/* Hands Holding Tablet Edges */}
          <circle cx="64" cy="180" r="6.5" fill="#e5a47e" />
          <circle cx="156" cy="180" r="6.5" fill="#e5a47e" />
        </g>
      </svg>
    </div>
  );
}
