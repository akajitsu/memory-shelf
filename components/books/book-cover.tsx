import type { CSSProperties } from "react";
import { foilFor, PATTERN_MASKS, type BookLook, type BookPattern } from "@/lib/book-design";
import { cn } from "@/lib/utils";
import {
  ArmillaryRings,
  AstrolabeArt,
  ConstellationFigure,
  Glyph,
  MoonPhases,
  planetGlyph,
  signForTitle,
  zodiacGlyph,
  ZodiacWheel,
} from "@/components/astro/astro";
import { ArchFrame, Divider, Sparkle } from "./ornaments";
import styles from "./book-cover.module.css";

/** CSS variables describing a book's leather and foil, shared by covers and spines. */
export function bookVars(color: string): CSSProperties {
  const foil = foilFor(color);
  return {
    "--leather": color,
    "--foil": foil.text,
    "--band": foil.band,
    "--glow": foil.glow,
  } as CSSProperties;
}

/** The tooled pattern layer (a foil-colored mask), or nothing for plain leather. */
export function PatternLayer({ pattern, className, scale = 1 }: { pattern: BookPattern; className?: string; scale?: number }) {
  if (pattern === "none") return null;
  const m = PATTERN_MASKS[pattern];
  const size = scale === 1 ? m.size : m.size.replace(/(\d+)px/g, (_, n) => `${Math.round(Number(n) * scale)}px`);
  return (
    <span
      aria-hidden
      className={cn(styles.pattern, className)}
      style={{ WebkitMaskImage: m.image, maskImage: m.image, WebkitMaskSize: size, maskSize: size }}
    />
  );
}

const CORNER_PLANETS = ["sun", "moon", "venus", "mars"] as const;

/**
 * Front cover of an album book — leather, a tooled pattern and gilt astrological
 * work in one of four bindings. Never shows a photograph: the cover is the album's
 * identity, the photographs live inside.
 */
export function BookCover({
  look,
  fill = false,
  className,
  style,
  patternScale = 1,
  showTitle = true,
}: {
  look: BookLook;
  /** Fill the parent exactly instead of a 4:5 box. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  patternScale?: number;
  /** False draws the cover without its title (a loading placeholder that doesn't know it yet). */
  showTitle?: boolean;
}) {
  const foil = foilFor(look.color);
  const title = look.title.trim() || "Untitled album";
  const long = title.length > 34;
  const sign = signForTitle(title);
  const titleEl = (
    <p className={cn(styles.title, long && styles.titleSmall)} style={showTitle ? undefined : { visibility: "hidden" }}>
      {title}
    </p>
  );

  return (
    <div
      className={cn(styles.cover, fill ? styles.fill : styles.ratio, foil.light && styles.light, className)}
      style={{ ...bookVars(look.color), ...style }}
      data-design={look.design}
      aria-hidden
    >
      <PatternLayer pattern={look.pattern} scale={patternScale} />
      <span className={styles.hinge} />

      {/* Zodiac Wheel: a natal-chart wheel, planets in the corners, the moon's phases below */}
      {look.design === "classic" && (
        <div className={cn(styles.gilt, styles.zodiac)}>
          <span className={styles.rule} />
          {CORNER_PLANETS.map((p, i) => (
            <Glyph key={p} d={planetGlyph(p)} className={cn(styles.cornerGlyph, styles[`c${i}` as "c0"])} width={1.5} />
          ))}
          {titleEl}
          <Divider className={styles.divider} star />
          <ZodiacWheel className={styles.wheel} />
          <MoonPhases className={styles.phases} />
        </div>
      )}

      {/* Lunar Phases: a great crescent between rows of phases, scattered stars */}
      {look.design === "celestial" && (
        <div className={cn(styles.gilt, styles.lunar)}>
          <span className={cn(styles.rule, styles.single)} />
          <MoonPhases className={styles.phases} />
          <svg viewBox="0 0 100 100" className={styles.crescent}>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 3" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
            <path d="M58 14a37 37 0 1 0 20 64A30 30 0 1 1 58 14Z" fill="currentColor" />
            <Sparkle cx={74} cy={30} s={6} />
            <Sparkle cx={84} cy={52} s={3.6} />
            <Sparkle cx={68} cy={70} s={2.6} />
            <circle cx="80" cy="40" r="1.2" fill="currentColor" />
          </svg>
          {titleEl}
          <MoonPhases className={cn(styles.phases, styles.phasesFlip)} />
        </div>
      )}

      {/* Observatory: an arched window framing the album's own constellation */}
      {look.design === "arch" && (
        <div className={cn(styles.gilt, styles.arch)}>
          <ArchFrame className={styles.archFrame} />
          <Glyph d={zodiacGlyph(sign)} className={styles.keystone} width={1.6} />
          <div className={styles.observatory}>
            <ArmillaryRings className={styles.armillary} />
            <ConstellationFigure sign={sign} className={styles.figure} />
          </div>
          {titleEl}
          <Divider className={styles.divider} star />
        </div>
      )}

      {/* Astrolabe: the brass instrument, in gilt */}
      {look.design === "astrolabe" && (
        <div className={cn(styles.gilt, styles.astrolabe)}>
          <span className={cn(styles.rule, styles.single)} />
          <AstrolabeArt className={styles.instrument} />
          {titleEl}
          <Divider className={styles.divider} star />
        </div>
      )}
    </div>
  );
}
