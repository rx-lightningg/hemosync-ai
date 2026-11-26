export default function BackgroundMesh() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Subtle radial medical-tech depth glows (desktop only to avoid heavy mobile GPU blur) */}
      <div
        className="hidden md:block absolute -top-36 -left-24 w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
        style={{
          background:
            'radial-gradient(circle, rgba(225,29,72,0.22) 0%, rgba(15,23,42,0) 70%)',
        }}
      />
      <div
        className="hidden md:block absolute top-12 -right-24 w-[540px] h-[540px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(6,11,25,0) 72%)',
        }}
      />

      {/* Faint animated SVG heartbeat & Ranchi network mesh lines */}
      <svg
        className="w-full h-full opacity-[0.14]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="ecgGrad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
            <stop offset="45%" stopColor="#f43f5e" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="netLineGrad" x1="0" y1="0" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#e11d48" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Network constellation lines */}
        <path
          d="M140 180 L420 260 L760 150 L1080 280 L1320 190 M220 680 L540 560 L880 650 L1240 520 M420 260 L540 560 M760 150 L880 650"
          stroke="url(#netLineGrad)"
          strokeWidth="1"
          strokeDasharray="6 8"
        />

        {/* Subtle network anchor dots */}
        {[
          [140, 180],
          [420, 260],
          [760, 150],
          [1080, 280],
          [1320, 190],
          [540, 560],
          [880, 650],
          [1240, 520],
        ].map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r="3"
            fill={idx % 2 === 0 ? '#f43f5e' : '#38bdf8'}
            opacity="0.45"
          />
        ))}

        {/* Static dim ECG rail */}
        <path
          d="M0 440 L310 440 L335 440 L355 405 L375 480 L398 355 L422 505 L442 420 L465 440 L920 440 L945 440 L962 412 L982 474 L1004 370 L1026 492 L1045 424 L1068 440 L1440 440"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="1.2"
        />

        {/* Animated travelling heartbeat pulse */}
        <path
          className="ecg-trace-anim"
          d="M0 440 L310 440 L335 440 L355 405 L375 480 L398 355 L422 505 L442 420 L465 440 L920 440 L945 440 L962 412 L982 474 L1004 370 L1026 492 L1045 424 L1068 440 L1440 440"
          stroke="url(#ecgGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
