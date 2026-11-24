/**
 * The look of the library. A display preference only, kept in a cookie so the
 * server renders the chosen style straight away (no flash of the default).
 */
export const LIBRARY_STYLES = ["moonlit", "floating", "tree"] as const;
export type LibraryStyle = (typeof LIBRARY_STYLES)[number];

export const DEFAULT_LIBRARY_STYLE: LibraryStyle = "moonlit";
export const LIBRARY_STYLE_COOKIE = "ms-library";

export const LIBRARY_STYLE_INFO: Record<LibraryStyle, { name: string; short: string; description: string }> = {
  moonlit: { name: "Moonlit Shelves", short: "Shelves", description: "A floating bookcase beneath the crescent moon" },
  floating: { name: "Floating Library", short: "Floating", description: "Every book drifting freely in the air" },
  tree: { name: "Great Tree", short: "Tree", description: "Books kept in the hollows of an ancient tree" },
};

export function parseLibraryStyle(value: string | undefined | null): LibraryStyle {
  return (LIBRARY_STYLES as readonly string[]).includes(value ?? "") ? (value as LibraryStyle) : DEFAULT_LIBRARY_STYLE;
}

/** Remember the choice for a year (client side). */
export function saveLibraryStyle(style: LibraryStyle) {
  document.cookie = `${LIBRARY_STYLE_COOKIE}=${style}; path=/; max-age=31536000; samesite=lax`;
}
