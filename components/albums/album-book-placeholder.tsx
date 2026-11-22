"use client";

import { useState } from "react";
import { peekBookHandoff } from "@/lib/book-handoff";
import { AlbumBook } from "./album-book";

/**
 * Loading state for an album: the same closed book, in the same place, using the
 * color/title/cover handed over by the bookshelf. When the data arrives the real
 * AlbumBook renders the identical closed book, then opens it.
 */
export function AlbumBookPlaceholder() {
  const [handoff] = useState(() => peekBookHandoff());
  return (
    <AlbumBook
      pending
      showCoverTitle={!!handoff}
      coverColor={handoff?.coverColor ?? "#4a3324"}
      coverUrl={handoff?.coverUrl ?? null}
      photos={[]}
      meta={{
        id: handoff?.id ?? "",
        title: handoff?.title ?? "",
        description: null,
        createdAt: "1970-01-01T00:00:00Z",
        photoCount: 0,
      }}
    />
  );
}
