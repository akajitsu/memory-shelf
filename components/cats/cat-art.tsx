/**
 * Wizard-cat illustrations: sitting, walking and sleeping poses drawn in SVG.
 * Colors come from CSS variables (see catVars), animations from cats.module.css.
 */
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import styles from "./cats.module.css";

export type CatLook = {
  fur: string;
  shade: string;
  light: string;
  ear: string;
  eye: string;
  hat: string;
  hatShade: string;
  band: string;
  star: string;
};

export const CAT_VARIANTS: { name: string; look: CatLook }[] = [
  {
    name: "Black cat, purple hat",
    look: { fur: "#2b2836", shade: "#1b1924", light: "#3d394c", ear: "#7a5878", eye: "#e8d78b", hat: "#5a45a3", hatShade: "#3d2f78", band: "#e8d78b", star: "#f4e6a8" },
  },
  {
    name: "White cat, blue hat",
    look: { fur: "#ece7de", shade: "#c9c1b3", light: "#fbf8f1", ear: "#e7b3c0", eye: "#5ab3c4", hat: "#2f5aa8", hatShade: "#203f7a", band: "#e8d78b", star: "#f4e6a8" },
  },
  {
    name: "Orange cat, golden hat",
    look: { fur: "#d4874a", shade: "#a9632f", light: "#f1c99c", ear: "#e7a08a", eye: "#8bb85a", hat: "#c9a03a", hatShade: "#9a7524", band: "#6b3249", star: "#fff3c4" },
  },
  {
    name: "Gray cat, teal hat",
    look: { fur: "#8b94a5", shade: "#687183", light: "#c6ccd6", ear: "#d69ba9", eye: "#e8d78b", hat: "#1d6f72", hatShade: "#124f52", band: "#e8d78b", star: "#83d9d4" },
  },
  {
    name: "Cream cat, lavender hat",
    look: { fur: "#e6d3b0", shade: "#c8ad83", light: "#f6ead3", ear: "#e6adb6", eye: "#6f9bd1", hat: "#9583c6", hatShade: "#6e5da0", band: "#f0ebdd", star: "#fff6d2" },
  },
];

export function catVars(look: CatLook): CSSProperties {
  return {
    "--fur": look.fur,
    "--fur-shade": look.shade,
    "--fur-light": look.light,
    "--ear": look.ear,
    "--eye": look.eye,
    "--hat": look.hat,
    "--hat-shade": look.hatShade,
    "--band": look.band,
    "--star": look.star,
  } as CSSProperties;
}

const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });

function Sparkle({ cx, cy, s, className, style }: { cx: number; cy: number; s: number; className?: string; style?: CSSProperties }) {
  const q = s * 0.18;
  return (
    <path
      className={className}
      style={style}
      d={`M${cx} ${cy - s}Q${cx + q} ${cy - q} ${cx + s} ${cy}Q${cx + q} ${cy + q} ${cx} ${cy + s}Q${cx - q} ${cy + q} ${cx - s} ${cy}Q${cx - q} ${cy - q} ${cx} ${cy - s}Z`}
      fill="var(--star)"
    />
  );
}

/** Pointed wizard hat with a bent tip, a band and a star. Drawn around (cx, baseY). */
function Hat({ cx, baseY, w = 38, h = 40, tilt = -8, magic = true }: { cx: number; baseY: number; w?: number; h?: number; tilt?: number; magic?: boolean }) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const top = baseY - h;
  return (
    <g transform={`rotate(${tilt} ${cx} ${baseY})`}>
      <path
        d={`M${l} ${baseY} C${l + w * 0.14} ${baseY - h * 0.32}, ${cx - w * 0.2} ${baseY - h * 0.62}, ${cx - w * 0.06} ${top + h * 0.12}
            C${cx} ${top + h * 0.02}, ${cx + w * 0.22} ${top - h * 0.04}, ${cx + w * 0.36} ${top + h * 0.06}
            C${cx + w * 0.26} ${top + h * 0.16}, ${cx + w * 0.12} ${top + h * 0.2}, ${cx + w * 0.12} ${top + h * 0.28}
            C${cx + w * 0.22} ${baseY - h * 0.4}, ${r - w * 0.1} ${baseY - h * 0.16}, ${r} ${baseY} Z`}
        fill="var(--hat)"
      />
      <path
        d={`M${cx + w * 0.12} ${top + h * 0.28} C${cx + w * 0.22} ${baseY - h * 0.4}, ${r - w * 0.1} ${baseY - h * 0.16}, ${r} ${baseY} L${cx + w * 0.18} ${baseY} C${cx + w * 0.16} ${baseY - h * 0.3}, ${cx + w * 0.12} ${baseY - h * 0.5}, ${cx + w * 0.12} ${top + h * 0.28} Z`}
        fill="var(--hat-shade)"
        opacity="0.55"
      />
      <ellipse cx={cx} cy={baseY} rx={w * 0.78} ry={w * 0.13} fill="var(--hat-shade)" />
      <ellipse cx={cx} cy={baseY - 1} rx={w * 0.74} ry={w * 0.1} fill="var(--hat)" />
      <path
        d={`M${l + w * 0.06} ${baseY - h * 0.14} C${cx - w * 0.2} ${baseY - h * 0.06}, ${cx + w * 0.2} ${baseY - h * 0.06}, ${r - w * 0.06} ${baseY - h * 0.14}
            L${r - w * 0.02} ${baseY - h * 0.02} C${cx + w * 0.2} ${baseY + h * 0.06}, ${cx - w * 0.2} ${baseY + h * 0.06}, ${l + w * 0.02} ${baseY - h * 0.02} Z`}
        fill="var(--band)"
      />
      <Sparkle cx={cx - w * 0.02} cy={baseY - h * 0.45} s={w * 0.11} className={styles.hatStar} style={origin(cx - w * 0.02, baseY - h * 0.45)} />
      {magic && (
        <g className={styles.tipMagic} style={origin(cx + w * 0.36, top + h * 0.06)}>
          <circle cx={cx + w * 0.36} cy={top + h * 0.06} r={w * 0.16} fill="var(--star)" opacity="0.25" />
          <Sparkle cx={cx + w * 0.36} cy={top + h * 0.06} s={w * 0.1} />
        </g>
      )}
    </g>
  );
}

/** A cat sitting upright, three-quarter view. Blinks, looks around, swishes its tail. */
export function SittingCat({ look, className, magic = true }: { look: CatLook; className?: string; magic?: boolean }) {
  return (
    <svg viewBox="0 -14 120 166" className={cn(styles.cat, className)} style={catVars(look)} aria-hidden>
      {/* tail, behind the body */}
      <path
        className={styles.tailSit}
        style={origin(84, 142)}
        d="M84 142 C110 142, 118 116, 106 98 C101 91, 108 82, 114 88"
        fill="none"
        stroke="var(--fur)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* body */}
      <path d="M60 74 C36 76, 28 108, 30 132 C31 146, 44 150, 60 150 C76 150, 89 146, 90 132 C92 108, 84 76, 60 74 Z" fill="var(--fur)" />
      <path d="M74 80 C86 92, 92 112, 90 132 C89 144, 80 149, 68 150 C80 140, 84 116, 74 80 Z" fill="var(--fur-shade)" opacity="0.6" />
      <path d="M60 88 C50 90, 46 106, 49 120 C52 131, 68 131, 71 120 C74 106, 70 90, 60 88 Z" fill="var(--fur-light)" />
      <ellipse cx="48" cy="148" rx="9.5" ry="5" fill="var(--fur-light)" />
      <ellipse cx="72" cy="148" rx="9.5" ry="5" fill="var(--fur-light)" />
      <path d="M45 146v4M49 146v4M69 146v4M73 146v4" stroke="var(--fur-shade)" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />

      {/* head */}
      <g className={styles.head} style={origin(60, 84)}>
        <path d="M37 60 L35 30 L55 46 Z" fill="var(--fur)" />
        <path d="M83 60 L85 30 L65 46 Z" fill="var(--fur)" />
        <path d="M39 53 L38.5 37 L50 46.5 Z" fill="var(--ear)" />
        <path d="M81 53 L81.5 37 L70 46.5 Z" fill="var(--ear)" />
        <path d="M60 40 C80 40, 88 54, 86 66 C84 80, 72 87, 60 87 C48 87, 36 80, 34 66 C32 54, 40 40, 60 40 Z" fill="var(--fur)" />
        <ellipse cx="60" cy="74" rx="11" ry="7.5" fill="var(--fur-light)" />
        <g className={styles.eyes} style={origin(60, 63)}>
          <ellipse cx="50" cy="63" rx="4.8" ry="5.4" fill="var(--eye)" />
          <ellipse cx="70" cy="63" rx="4.8" ry="5.4" fill="var(--eye)" />
          <ellipse cx="50.4" cy="63.4" rx="1.5" ry="4.1" fill="#15141e" />
          <ellipse cx="70.4" cy="63.4" rx="1.5" ry="4.1" fill="#15141e" />
          <circle cx="52" cy="61.2" r="1.2" fill="#fff" />
          <circle cx="72" cy="61.2" r="1.2" fill="#fff" />
        </g>
        <path d="M57.4 71 L62.6 71 L60 73.8 Z" fill="#e391a3" />
        <path d="M60 73.8 Q58 77 55.4 76 M60 73.8 Q62 77 64.6 76" stroke="var(--fur-shade)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M49 74 L34 71.5 M49 76.5 L35 77.5 M71 74 L86 71.5 M71 76.5 L85 77.5" stroke="var(--fur-light)" strokeWidth="0.7" opacity="0.75" strokeLinecap="round" />
        <Hat cx={60} baseY={45} w={40} h={44} tilt={-9} magic={magic} />
      </g>
    </svg>
  );
}

/** A cat walking to the right. `still` stops the stride (pausing to look around). */
export function WalkingCat({ look, className, still = false }: { look: CatLook; className?: string; still?: boolean }) {
  const leg = (x: number, cls: string, far: boolean) => (
    <path
      className={cn(styles.leg, cls)}
      style={origin(x + 5, 68)}
      d={`M${x} 66 L${x} 96 Q${x} 101 ${x + 4.5} 101 L${x + 7} 101 Q${x + 10.5} 101 ${x + 10.5} 97 L${x + 10.5} 66 Z`}
      fill={far ? "var(--fur-shade)" : "var(--fur)"}
    />
  );
  return (
    <svg viewBox="0 -24 170 128" className={cn(styles.cat, still && styles.still, className)} style={catVars(look)} aria-hidden>
      <path
        className={styles.tailWalk}
        style={origin(42, 54)}
        d="M42 54 C24 48, 16 30, 23 16 C27 9, 34 10, 33 17"
        fill="none"
        stroke="var(--fur)"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <g className={styles.stride}>
        {leg(52, styles.legB, true)}
        {leg(104, styles.legA, true)}
        <path d="M40 54 C40 41, 60 37, 82 38 C104 39, 121 44, 123 58 C125 74, 108 81, 82 81 C58 81, 40 72, 40 54 Z" fill="var(--fur)" />
        <path d="M44 50 C52 42, 72 39, 92 40 C76 44, 56 46, 44 50 Z" fill="var(--fur-light)" opacity="0.35" />
        <path d="M58 76 C76 82, 100 82, 113 73 C104 80, 70 84, 58 76 Z" fill="var(--fur-light)" />
        {leg(44, styles.legA, false)}
        {leg(96, styles.legB, false)}
        <g className={styles.walkHead} style={origin(124, 56)}>
          <path d="M117 34 L118 12 L131 27 Z" fill="var(--fur)" />
          <path d="M135 27 L146 10 L148 32 Z" fill="var(--fur)" />
          <path d="M120 30 L120.5 17 L128 26.5 Z" fill="var(--ear)" />
          <path d="M138 27 L144.5 16 L146 29 Z" fill="var(--ear)" />
          <path d="M133 25 C147 25, 154 35, 153 46 C152 58, 142 64, 131 63 C119 62, 113 54, 114 44 C115 33, 122 25, 133 25 Z" fill="var(--fur)" />
          <ellipse cx="145" cy="52" rx="8" ry="5.6" fill="var(--fur-light)" />
          <g className={styles.eyes} style={origin(141, 43)}>
            <ellipse cx="141" cy="43" rx="3.8" ry="4.4" fill="var(--eye)" />
            <ellipse cx="142" cy="43.3" rx="1.2" ry="3.4" fill="#15141e" />
            <circle cx="143" cy="41.6" r="1" fill="#fff" />
          </g>
          <path d="M151 48.5 L154.4 48.8 L152.4 51.2 Z" fill="#e391a3" />
          <path d="M145 53 L160 51 M145 55 L159 56.5" stroke="var(--fur-light)" strokeWidth="0.7" opacity="0.75" strokeLinecap="round" />
          <Hat cx={131} baseY={29} w={32} h={36} tilt={-14} />
        </g>
      </g>
    </svg>
  );
}

/** A cat curled up asleep, its hat slipping off. */
export function SleepingCat({ look, className }: { look: CatLook; className?: string }) {
  return (
    <svg viewBox="0 -30 150 112" className={cn(styles.cat, className)} style={catVars(look)} aria-hidden>
      <g className={styles.breathe} style={origin(72, 76)}>
        <path d="M22 62 C19 38, 46 24, 76 24 C106 24, 128 38, 125 60 C123 72, 102 76, 72 76 C42 76, 23 72, 22 62 Z" fill="var(--fur)" />
        <path d="M46 30 C62 25, 92 25, 108 32 C92 30, 64 30, 46 30 Z" fill="var(--fur-light)" opacity="0.4" />
        <path d="M98 70 C112 70, 124 64, 125 56 C126 68, 112 76, 96 76 Z" fill="var(--fur-shade)" opacity="0.6" />
      </g>
      {/* tail wrapped round the front */}
      <path d="M118 64 C110 78, 70 82, 40 74" fill="none" stroke="var(--fur)" strokeWidth="9" strokeLinecap="round" />
      <path d="M44 75 C66 80, 96 80, 112 70" fill="none" stroke="var(--fur-shade)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* head resting on the paws */}
      <g>
        <ellipse cx="40" cy="70" rx="10" ry="5" fill="var(--fur-light)" />
        <path d="M22 44 L22 24 L36 36 Z" fill="var(--fur)" />
        <path d="M46 36 L58 26 L58 46 Z" fill="var(--fur)" />
        <path d="M24.5 38 L24.5 28 L32 35 Z" fill="var(--ear)" />
        <path d="M37 37 C50 37, 58 46, 57 56 C56 66, 47 70, 38 70 C26 70, 19 63, 19 54 C19 44, 26 37, 37 37 Z" fill="var(--fur)" />
        <ellipse cx="40" cy="62" rx="9" ry="5.8" fill="var(--fur-light)" />
        <path d="M27 54 Q30.5 57 34 54 M42 54 Q45.5 57 49 54" stroke="#15141e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M38.4 59 L41.6 59 L40 61 Z" fill="#e391a3" />
        <Hat cx={30} baseY={36} w={30} h={32} tilt={-38} magic={false} />
      </g>
      <g className={styles.zzz} fill="var(--star)">
        <text x="62" y="12" style={{ animationDelay: "0s" }}>z</text>
        <text x="70" y="2" style={{ animationDelay: "1.2s" }}>z</text>
        <text x="79" y="-8" style={{ animationDelay: "2.4s" }}>Z</text>
      </g>
    </svg>
  );
}
