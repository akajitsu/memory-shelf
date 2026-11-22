import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./bookshelf.module.css";
import { NAV_FORWARD } from "@/components/layout/page-transition";

export function NewAlbumBook() {
  return (
    <div className={styles.slot} role="listitem">
      <Link href="/albums/new" transitionTypes={NAV_FORWARD} className={styles.link} aria-label="Create a new album">
        <div className={styles.newBook}>
          <Plus className="size-5" aria-hidden />
          <span>New album</span>
        </div>
      </Link>
    </div>
  );
}
