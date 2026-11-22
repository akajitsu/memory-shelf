import type { ReactNode } from "react";
import styles from "./bookshelf.module.css";

/** Wooden bookcase frame. Children are shelf slots that wrap onto new shelves. */
export function Bookcase({ children, label, dimmed = false }: { children?: ReactNode; label: string; dimmed?: boolean }) {
  return (
    <section className={styles.case} aria-label={label}>
      <div className={styles.crown} />
      <div className={styles.body}>
        <div className={styles.side} />
        <div className={`${styles.shelves} ${dimmed ? styles.dimmed : ""}`} role="list">
          {children}
        </div>
        <div className={styles.side} />
        <div className={styles.glow} aria-hidden />
      </div>
      <div className={styles.plinth} />
    </section>
  );
}
