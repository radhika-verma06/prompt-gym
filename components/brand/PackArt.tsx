/**
 * Custom SVG art. Each challenge gets its own scene and palette so the three cards
 * are recognisable at a glance, without stock illustration or emoji.
 */

export function PackArt({ id, className = "" }: { id: string; className?: string }) {
  if (id === "following-rules") return <RulesArt className={className} />;
  if (id === "rewrite-without-losing-meaning") return <RewriteArt className={className} />;
  return <ExtractionArt className={className} />;
}

function ExtractionArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 150" className={className} role="img" aria-label="Messages being tidied into a JSON record">
      <defs>
        <linearGradient id="se-box" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2C477E" />
          <stop offset="1" stopColor="#1B2C52" />
        </linearGradient>
      </defs>
      <ellipse cx="132" cy="132" rx="98" ry="10" fill="#E9DFCC" />
      <g transform="rotate(-4 52 56)">
        <rect x="8" y="26" width="60" height="38" rx="12" fill="#FFF6E7" stroke="#E2C79E" strokeWidth="2" />
        <path d="M20 40h34M20 48h24" stroke="#D08B3C" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="rotate(4 56 92)">
        <rect x="16" y="70" width="54" height="34" rx="11" fill="#FCEEDB" stroke="#E7BE87" strokeWidth="2" />
        <path d="M27 83h30M27 91h18" stroke="#D08B3C" strokeWidth="3" strokeLinecap="round" />
      </g>
      <path d="M82 68h22" stroke="#23396B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 5" />
      <path d="m100 63 6 5-6 5" stroke="#23396B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      <g transform="translate(112 24)">
        <rect width="104" height="94" rx="14" fill="url(#se-box)" />
        <rect x="1" y="1" width="102" height="92" rx="13" fill="none" stroke="#3F5C93" />
        <path d="M22 22c-5 0-5 6-5 9s0 7-5 8c5 1 5 5 5 8s0 9 5 9" stroke="#F49B42" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M82 22c5 0 5 6 5 9s0 7 5 8c-5 1-5 5-5 8s0 9-5 9" stroke="#F49B42" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <rect x="34" y="34" width="42" height="7" rx="3.5" fill="#8FA8D8" />
        <rect x="34" y="49" width="30" height="7" rx="3.5" fill="#6F8CC4" />
        <rect x="34" y="64" width="36" height="7" rx="3.5" fill="#F49B42" />
      </g>
      <g transform="translate(202 18)">
        <path d="m8 0 2.2 5.8L16 8l-5.8 2.2L8 16l-2.2-5.8L0 8l5.8-2.2L8 0Z" fill="#F49B42" />
      </g>
      <circle cx="222" cy="96" r="5" fill="#56C3A4" />
      <circle cx="236" cy="112" r="3" fill="#EF6F62" />
    </svg>
  );
}

function RulesArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 150" className={className} role="img" aria-label="Requests passing a policy checkpoint">
      <ellipse cx="132" cy="132" rx="98" ry="10" fill="#DCE7DF" />
      <path d="M6 104h62" stroke="#23396B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 6" />
      <g transform="translate(4 46)">
        <rect width="48" height="34" rx="10" fill="#FFFDF8" stroke="#BFD3C8" strokeWidth="2" />
        <path d="M10 12h26M10 21h16" stroke="#6C8B7C" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="translate(6 84)">
        <rect width="40" height="28" rx="9" fill="#E4F5EE" stroke="#BFD3C8" strokeWidth="2" />
        <path d="M9 10h20M9 18h12" stroke="#4E9A82" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      <g transform="translate(104 14)">
        <rect x="12" y="0" width="8" height="46" rx="4" fill="#C7B79A" />
        <rect x="0" y="40" width="32" height="7" rx="3.5" fill="#D8C8AA" />
        <path
          d="M52 4 32 12v26c0 16 11 27 26 33 15-6 26-17 26-33V12L58 4Z"
          transform="translate(-4 0)"
          fill="#56C3A4"
          stroke="#1F6B58"
          strokeWidth="2.5"
        />
        <path d="m42 42 8 8 16-18" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      <g transform="translate(192 44) rotate(10)">
        <rect width="52" height="36" rx="10" fill="#FFEDE9" stroke="#EFB4AC" strokeWidth="2" />
        <path d="m18 12 16 12M34 12 18 24" stroke="#C25249" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="translate(188 96)">
        <rect width="46" height="30" rx="9" fill="#FFFDF8" stroke="#BFD3C8" strokeWidth="2" />
        <path d="M10 11h24M10 19h14" stroke="#6C8B7C" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <circle cx="86" cy="34" r="4" fill="#56C3A4" />
    </svg>
  );
}

function RewriteArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 150" className={className} role="img" aria-label="A long message cut down without losing its facts">
      <ellipse cx="132" cy="132" rx="98" ry="10" fill="#F1DFDA" />
      <g transform="translate(6 26) rotate(-3)">
        <rect width="104" height="80" rx="12" fill="#FFFDF8" stroke="#E8C8C1" strokeWidth="2" />
        <path d="M14 20h72M14 32h60M14 44h76M14 56h48" stroke="#C98D84" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M14 68h64" stroke="#E0B5AD" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <g transform="translate(104 44)">
        <circle cx="12" cy="12" r="9" fill="none" stroke="#23396B" strokeWidth="2.6" />
        <circle cx="12" cy="46" r="9" fill="none" stroke="#23396B" strokeWidth="2.6" />
        <path d="m18 18 26 22M44 18 18 40" stroke="#23396B" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <g transform="translate(142 40) rotate(3)">
        <rect width="106" height="66" rx="12" fill="#FCE9E6" stroke="#EFA79D" strokeWidth="2" />
        <path d="M14 20h52M14 32h64M14 44h40" stroke="#B9584D" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <g transform="translate(152 112)">
        <rect width="78" height="24" rx="12" fill="#FFFDF8" stroke="#E4DCCB" />
        <path d="M12 12h8" stroke="#23396B" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="30" cy="12" r="4" fill="#F49B42" />
        <circle cx="44" cy="12" r="4" fill="#56C3A4" />
        <circle cx="58" cy="12" r="4" fill="#EF6F62" />
      </g>
      <path d="m232 22 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#EF6F62" />
    </svg>
  );
}

export function Wordmark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#23396B" />
      <path d="M13 12c-2.4 0-2.4 3.4-2.4 5s0 3.4-2.6 3.9c2.6.5 2.6 2.4 2.6 4s0 5 2.4 5" stroke="#FFFDF8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M27 12c2.4 0 2.4 3.4 2.4 5s0 3.4 2.6 3.9c-2.6.5-2.6 2.4-2.6 4s0 5-2.4 5" stroke="#FFFDF8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.2" fill="#F49B42" />
    </svg>
  );
}
