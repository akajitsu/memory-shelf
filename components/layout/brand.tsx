import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

const sparkle = (x: number, y: number, s: number) => {
  const q = s * 0.18;
  return `M${x} ${y - s}Q${x + q} ${y - q} ${x + s} ${y}Q${x + q} ${y + q} ${x} ${y + s}Q${x - q} ${y + q} ${x - s} ${y}Q${x - q} ${y - q} ${x} ${y - s}Z`;
};

/**
 * The library's mark: a wizard cat in a pointed hat, inside a small round night sky
 * with a gilt rim, a crescent moon and a few stars. Also used as the favicon
 * (app/icon.svg). Default size 32px.
 */
export function BrandMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const sky = `${id}-sky`;
  const halo = `${id}-halo`;
  const hat = `${id}-hat`;
  const clip = `${id}-clip`;
  return (
    <svg viewBox="0 0 64 64" className={className ?? "size-8"} aria-hidden>
      <defs>
        <radialGradient id={sky} cx="50%" cy="38%" r="68%">
          <stop offset="0" stopColor="#24427c" />
          <stop offset="0.55" stopColor="#152747" />
          <stop offset="1" stopColor="#0a1330" />
        </radialGradient>
        <radialGradient id={halo} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e8d78b" stopOpacity="0.42" />
          <stop offset="1" stopColor="#e8d78b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={hat} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8571d6" />
          <stop offset="1" stopColor="#3f3181" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>

      {/* the little night sky */}
      <circle cx="32" cy="32" r="31" fill={`url(#${sky})`} />
      <g clipPath={`url(#${clip})`}>
        <circle cx="32" cy="41" r="21" fill={`url(#${halo})`} />
        <path d="M15.5 9.5a7 7 0 1 0 6.4 10.3a5.6 5.6 0 1 1-6.4-10.3Z" fill="#e8d78b" opacity="0.9" />
        <circle cx="9" cy="30" r="0.8" fill="#f0ebdd" opacity="0.8" />
        <circle cx="53" cy="22" r="0.7" fill="#f0ebdd" opacity="0.75" />
        <circle cx="55.5" cy="38" r="0.9" fill="#83d9d4" opacity="0.8" />
        <circle cx="25" cy="7" r="0.6" fill="#f0ebdd" opacity="0.6" />
        <path d={sparkle(51, 49, 2.2)} fill="#e8d78b" opacity="0.85" />
        <path d={sparkle(11, 45, 1.6)} fill="#f0ebdd" opacity="0.7" />
        {/* shoulders */}
        <path d="M13 66 C15 54, 22.5 49.5, 32 49.5 C41.5 49.5, 49 54, 51 66 Z" fill="#d9cfbd" />
      </g>

      {/* ears */}
      <path d="M19.4 39 L18.4 23.6 L28.4 31 Z" fill="#f0ebdd" />
      <path d="M44.6 39 L45.6 23.6 L35.6 31 Z" fill="#f0ebdd" />
      <path d="M21 35.5 L20.5 27.4 L26.2 31.6 Z" fill="#e7a9b8" />
      <path d="M43 35.5 L43.5 27.4 L37.8 31.6 Z" fill="#e7a9b8" />
      {/* head */}
      <path d="M32 28.8 C42.2 28.8 46.6 35.2 45.6 41.8 C44.6 48.6 38.6 52.2 32 52.2 C25.4 52.2 19.4 48.6 18.4 41.8 C17.4 35.2 21.8 28.8 32 28.8 Z" fill="#f0ebdd" />
      <path d="M39.5 31 C44 33.5 46.3 37.5 45.6 41.8 C44.8 47.4 40.6 50.8 35.5 51.9 C40.5 48.5 42.6 41 39.5 31 Z" fill="#d9cfbd" opacity="0.7" />
      {/* eyes with a glint of moonlight */}
      <ellipse cx="26.8" cy="40.6" rx="2.35" ry="2.8" fill="#1b2547" />
      <ellipse cx="37.2" cy="40.6" rx="2.35" ry="2.8" fill="#1b2547" />
      <circle cx="27.6" cy="39.6" r="0.8" fill="#e8d78b" />
      <circle cx="38" cy="39.6" r="0.8" fill="#e8d78b" />
      <path d="M30.7 44.7 L33.3 44.7 L32 46.2 Z" fill="#e391a3" />
      <path d="M32 46.2 Q31 47.8 29.5 47.1 M32 46.2 Q33 47.8 34.5 47.1" stroke="#a8998a" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M27 45.4 L19.5 44.3 M27 46.8 L20 47.6 M37 45.4 L44.5 44.3 M37 46.8 L44 47.6" stroke="#bfb3a3" strokeWidth="0.45" strokeLinecap="round" />

      {/* wizard hat with a bent tip */}
      <ellipse cx="32" cy="31" rx="15.2" ry="3.3" fill="#2f2468" />
      <ellipse cx="32" cy="30.4" rx="14.6" ry="2.4" fill="#5544a8" />
      <path
        d="M21.4 30.6 C23.4 23.2, 26.4 15.2, 29.9 8.6 C31.5 5.6, 35 4.1, 38.6 5.1 C41.1 5.8, 43.1 7.6, 45.6 6.6 C43.9 9.7, 40.6 10.4, 37.9 9.8 C39.7 16.2, 41.5 23.3, 42.6 30.6 Z"
        fill={`url(#${hat})`}
      />
      <path d="M22.5 27.2 C28.4 29, 35.6 29, 41.7 27.2 L42.4 30.3 C35.6 32.3, 28.4 32.3, 21.7 30.3 Z" fill="#e8d78b" />
      <path d={sparkle(32.4, 18.5, 3.1)} fill="#f4e6a8" />
      <path d={sparkle(45.6, 6.6, 1.9)} fill="#f4e6a8" />

      {/* gilt rim */}
      <circle cx="32" cy="32" r="30.6" fill="none" stroke="#e8d78b" strokeOpacity="0.8" strokeWidth="1.3" />
      <circle cx="32" cy="32" r="28.7" fill="none" stroke="#e8d78b" strokeOpacity="0.22" strokeWidth="0.6" />
    </svg>
  );
}

/** Crescent moon cradling a small star — used as an ornament (bookcase keystone). */
export function MoonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className ?? "size-7"} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#e8d78b" opacity="0.12" />
      <path d="M19.6 6.2a10 10 0 1 0 6.2 15.2 8.2 8.2 0 1 1-6.2-15.2Z" fill="#e8d78b" />
      <path d="M21.5 10.2l.75 1.9 1.9.75-1.9.75-.75 1.9-.75-1.9-1.9-.75 1.9-.75Z" fill="#f0ebdd" />
    </svg>
  );
}

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full font-ornate text-[19px] font-bold tracking-[0.03em] text-ivory",
        className,
      )}
    >
      <BrandMark className="size-9 drop-shadow-[0_0_10px_rgb(232_215_139/0.25)] transition-transform duration-700 ease-out group-hover:-rotate-6" />
      <span className={compact ? "max-sm:sr-only" : undefined}>Memory Shelf</span>
    </Link>
  );
}
