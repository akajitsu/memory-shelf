import { Sparkle } from "@/components/books/ornaments";

/** A closed tome in three-quarter view, for the drifting books in the background. */
export function Tome({ color = "#1b555b", className, emblem = "star" }: { color?: string; className?: string; emblem?: "star" | "moon" }) {
  return (
    <svg viewBox="0 0 100 132" className={className} aria-hidden>
      <defs>
        <linearGradient id={`tome-${color.slice(1)}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.32" />
        </linearGradient>
      </defs>
      {/* back board and page block */}
      <path d="M14 12L90 8L96 14V126L20 130Z" fill={color} />
      <path d="M86 12L94 16V124L86 120Z" fill="#efe6d1" />
      {[24, 36, 48, 60, 72, 84, 96, 108].map((y) => (
        <path key={y} d={`M86.5 ${y}L93.5 ${y + 3}`} stroke="#c9bc9c" strokeWidth="0.5" />
      ))}
      <path d="M12 120L86 120L94 124L20 128Z" fill="#e3d8bd" />
      {/* front board */}
      <rect x="8" y="6" width="80" height="116" rx="3" fill={color} />
      <rect x="8" y="6" width="80" height="116" rx="3" fill={`url(#tome-${color.slice(1)})`} />
      <rect x="8" y="6" width="9" height="116" rx="2" fill="#000" opacity="0.28" />
      {/* gilt frame and emblem */}
      <rect x="23" y="16" width="56" height="96" rx="1.5" fill="none" stroke="#e8d78b" strokeOpacity="0.6" strokeWidth="1" />
      <rect x="27" y="20" width="48" height="88" fill="none" stroke="#e8d78b" strokeOpacity="0.35" strokeWidth="0.6" />
      <g color="#e8d78b">
        {emblem === "star" ? (
          <Sparkle cx={51} cy={56} s={12} />
        ) : (
          <path d="M55 42a15 15 0 1 0 8 27a12 12 0 1 1-8-27Z" fill="#e8d78b" />
        )}
        <path d="M37 86h28" stroke="#e8d78b" strokeOpacity="0.6" strokeWidth="1" />
        <path d="M41 91h20" stroke="#e8d78b" strokeOpacity="0.4" strokeWidth="1" />
      </g>
    </svg>
  );
}

/** An open book with illuminated pages, light rising from its gutter. */
export function OpenTome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 130" className={className} aria-hidden>
      <defs>
        <radialGradient id="open-light" cx="0.5" cy="0.62" r="0.6">
          <stop offset="0" stopColor="#fff6d2" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#e8d78b" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#83d9d4" stopOpacity="0.12" />
          <stop offset="1" stopColor="#83d9d4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="open-page-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9ceb2" />
          <stop offset="0.85" stopColor="#f6efdc" />
          <stop offset="1" stopColor="#fffaf0" />
        </linearGradient>
        <linearGradient id="open-page-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#d9ceb2" />
          <stop offset="0.85" stopColor="#f6efdc" />
          <stop offset="1" stopColor="#fffaf0" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="70" rx="100" ry="62" fill="url(#open-light)" />
      {/* boards */}
      <path d="M8 92Q54 78 100 98Q146 78 192 92L188 104Q146 92 100 110Q54 92 12 104Z" fill="#1b555b" />
      {/* pages */}
      <path d="M16 88Q56 66 100 86V100Q58 82 18 98Z" fill="url(#open-page-l)" />
      <path d="M184 88Q144 66 100 86V100Q142 82 182 98Z" fill="url(#open-page-r)" />
      <path d="M20 82Q58 58 100 80Q142 58 180 82" fill="none" stroke="#fffaf0" strokeWidth="1.5" opacity="0.9" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} stroke="#7d8197" strokeWidth="0.7" opacity="0.45">
          <path d={`M${32 + i * 2} ${86 - i * 3.6}Q${60} ${74 - i * 3.6} ${88} ${88 - i * 3}`} fill="none" />
          <path d={`M${168 - i * 2} ${86 - i * 3.6}Q${140} ${74 - i * 3.6} ${112} ${88 - i * 3}`} fill="none" />
        </g>
      ))}
      <path d="M100 80V100" stroke="#b8a77a" strokeWidth="0.8" />
    </svg>
  );
}
