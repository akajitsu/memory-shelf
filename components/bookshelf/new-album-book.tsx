import Link from "next/link";
import type { CSSProperties } from "react";
import { Plus } from "lucide-react";
import styles from "./bookshelf.module.css";
import { NAV_FORWARD } from "@/components/layout/page-transition";

/** An unbound book outline at the end of the shelf: create a new album. */
export function NewAlbumBook({ index = 0 }: { index?: number }) {
  return (
    <div className={styles.slot} role="listitem" style={{ "--i": index } as CSSProperties}>
      <Link href="/albums/new" transitionTypes={NAV_FORWARD} className={styles.link} aria-label="Create a new album">
        <div className={styles.newBook}>
          <Plus className="size-5" aria-hidden />
          <span>New album</span>
        </div>
      </Link>
    </div>
  );
}
