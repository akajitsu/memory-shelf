import type { BookLook } from "@/lib/book-design";
import { BookCover, bookVars } from "@/components/books/book-cover";
import { SpineGlyph } from "@/components/books/ornaments";
import styles from "./book-preview.module.css";

/** The album as a physical book, floating and slowly turning; hover to face it. */
export function BookPreview({ look }: { look: BookLook }) {
  const title = look.title.trim() || "Untitled album";
  return (
    <div className={styles.stage} aria-hidden>
      <span className={styles.glow} />
      <span className={styles.shadow} />
      <div className={styles.float}>
        <div className={styles.sway}>
          <div className={styles.book} style={bookVars(look.color)}>
            <div className={`${styles.face} ${styles.front}`}>
              <BookCover fill look={look} />
            </div>
            <div className={`${styles.face} ${styles.spine}`}>
              <span className={styles.band} style={{ top: "5%" }} />
              <span className={styles.band} style={{ top: "8%" }} />
              <SpineGlyph design={look.design} className="absolute top-[11%] left-1/2 size-[38%] -translate-x-1/2" />
              <span className={styles.spineTitle}>
                <span>{title}</span>
              </span>
              <span className={styles.band} style={{ bottom: "8%" }} />
              <span className={styles.band} style={{ bottom: "5%" }} />
            </div>
            <div className={`${styles.face} ${styles.pages}`} />
            <div className={`${styles.face} ${styles.top}`} />
            <div className={`${styles.face} ${styles.back}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
