import Link from "next/link";
import { BookX } from "lucide-react";

/**
 * "Not on the shelf" view. Used by app/not-found.tsx and rendered directly by album
 * pages whose lookup resolves inside a streaming Suspense boundary — throwing
 * notFound() there (after the shell has been sent) makes React log a recoverable
 * error (#419) while producing the same result.
 */
export function NotFoundView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center text-ivory">
      <BookX className="size-10 text-gold" aria-hidden />
      <h1 className="font-serif text-4xl font-medium sm:text-5xl">This page isn’t on the shelf</h1>
      <p className="max-w-md text-sm text-ivory/65">
        The album or page you’re looking for doesn’t exist, or it belongs to someone else’s library.
      </p>
      <Link
        href="/library"
        className="mt-2 inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-medium text-walnut-deep transition-colors hover:bg-gold-soft"
      >
        Back to your bookshelf
      </Link>
    </div>
  );
}
