/** An album as shown on the bookshelf. */
export type ShelfAlbum = {
  id: string;
  title: string;
  description: string | null;
  coverColor: string;
  /** Short-lived signed URL for the private cover image, if any. */
  coverUrl: string | null;
  photoCount: number;
};

/** A single album with details for its own page. */
export type AlbumDetail = ShelfAlbum & {
  createdAt: string;
  updatedAt: string;
};

/** A photograph ready to display (with a short-lived signed URL). */
export type AlbumPhotoView = {
  id: string;
  /** Full-size image (lightbox). */
  url: string | null;
  /** ~900px display thumbnail for pages and grids; falls back to `url`. */
  thumbUrl: string | null;
  name: string | null;
  caption: string | null;
  order: number;
};
