import type { ReactNode } from "react";
import { MoonMark } from "@/components/layout/brand";
import { ZodiacWheel } from "@/components/astro/astro";
import styles from "./bookshelf.module.css";

/**
 * The floating bookcase: an arched crown, two gilt-inlaid columns and floating
 * shelves, open to the sky. Children are shelf slots that wrap onto new shelves.
 * `perch` renders on top of the crown (a resting cat, for instance).
 */
export function Bookcase({
  children,
  label,
  dimmed = false,
  perch,
}: {
  children?: ReactNode;
  label: string;
  dimmed?: boolean;
  perch?: ReactNode;
}) {
  return (
    <section className={styles.case} aria-label={label}>
      <div className={styles.crown}>
        <div className={styles.crownArt} aria-hidden>
          <ZodiacWheel className={styles.crownWheel} />
        </div>
        <MoonMark className={styles.keystone} />
        {perch}
      </div>
      <div className={styles.body}>
        <div className={styles.side} />
        <div className={`${styles.shelves} ${dimmed ? styles.dimmed : ""}`} role="list">
          {children}
        </div>
        <div className={styles.side} />
        <div className={styles.glow} aria-hidden />
        <div className={styles.moonbeam} aria-hidden />
      </div>
      <div className={styles.plinth} />
    </section>
  );
}

export { styles as bookshelfStyles };
