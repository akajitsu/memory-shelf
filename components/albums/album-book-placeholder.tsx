"use client";

import { useState } from "react";
import { peekBookHandoff } from "@/lib/book-handoff";
import { DEFAULT_BOOK } from "@/lib/book-design";
import { AlbumBook } from "./album-book";

/**
 * Loading state for an album: the same closed book, in the same place, using the
 * color, design and title handed over by the bookshelf. When the data arrives the
 * real AlbumBook renders the identical closed book, then opens it.
 */
export function AlbumBookPlaceholder() {
  const [handoff] = useState(() => peekBookHandoff());
  return (
    <AlbumBook
      pending
      showCoverTitle={!!handoff}
      coverColor={handoff?.coverColor ?? "#152747"}
      coverDesign={handoff?.coverDesign ?? DEFAULT_BOOK.design}
      coverPattern={handoff?.coverPattern ?? "none"}
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
