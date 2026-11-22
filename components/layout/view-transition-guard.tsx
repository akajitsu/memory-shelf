"use client";

/**
 * Guards document.startViewTransition against the "document hidden" case.
 *
 * When a navigation (or a dev hot-reload) starts a view transition while the tab
 * is in the background, browsers abort it with an InvalidStateError. React 19.3
 * ignores that error only when the message matches exactly, but Edge/Chrome append
 * "Document hidden" — so it surfaces as an uncaught error. React also chains
 * `finished.finally()`, which leaves an unhandled rejection.
 *
 * This guard: (1) skips the transition outright while the page is hidden, running
 * the DOM update immediately; (2) normalizes the abort message React expects;
 * (3) makes `finished` settle without rejecting. Real errors are passed through.
 */
const REACT_IGNORED_MESSAGE = "View transition was skipped because document visibility state is hidden.";

type VT = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
  types?: unknown;
};

function isHiddenAbort(err: unknown) {
  return (
    err instanceof DOMException &&
    err.name === "InvalidStateError" &&
    /hidden|invalid state/i.test(err.message)
  );
}

if (typeof document !== "undefined" && "startViewTransition" in document) {
  const doc = document as unknown as { startViewTransition: (arg: unknown) => VT; __vtGuard?: boolean };
  if (!doc.__vtGuard) {
    doc.__vtGuard = true;
    const original = doc.startViewTransition.bind(doc);

    doc.startViewTransition = (arg: unknown) => {
      if (document.visibilityState === "hidden") {
        const update = typeof arg === "function" ? arg : (arg as { update?: () => unknown })?.update;
        const done = Promise.resolve().then(() => update?.()).then(() => undefined);
        const ready = Promise.reject(new DOMException(REACT_IGNORED_MESSAGE, "InvalidStateError"));
        ready.catch(() => {}); // React attaches its own handler; this just avoids a race warning
        return { ready, finished: done, updateCallbackDone: done, skipTransition: () => {} };
      }

      const t = original(arg);
      const normalize = (err: unknown) => {
        throw isHiddenAbort(err) ? new DOMException(REACT_IGNORED_MESSAGE, "InvalidStateError") : err;
      };
      return {
        ready: t.ready.catch(normalize),
        finished: t.finished.catch((err) => {
          if (!isHiddenAbort(err)) console.error(err);
        }),
        updateCallbackDone: t.updateCallbackDone,
        skipTransition: () => t.skipTransition(),
        get types() {
          return t.types;
        },
      };
    };
  }
}

export function ViewTransitionGuard() {
  return null;
}
