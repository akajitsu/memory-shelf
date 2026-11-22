import { ViewTransition, type ReactNode } from "react";

/** Navigation transition types used by links and router.push. */
export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];
export const BOOK_OPEN = ["book-open"];
export const BOOK_CLOSE = ["book-close"];

const map = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "book-open": "book-fade",
  "book-close": "book-fade",
  default: "none",
};

/**
 * Wrap each page's content (not layouts — they persist) so navigations tagged
 * with a transition type animate directionally. Untyped transitions (browser
 * back, refresh, Suspense reveals) don't slide.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={map} exit={map} default="none">
      {children}
    </ViewTransition>
  );
}

/** Suspense fallback that fades out when content arrives. */
export function SkeletonOut({ children }: { children: ReactNode }) {
  return (
    <ViewTransition exit="skeleton-out" default="none">
      {children}
    </ViewTransition>
  );
}

/** Suspense content that rises in when it replaces a skeleton. */
export function ContentIn({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="content-in" default="none">
      {children}
    </ViewTransition>
  );
}
