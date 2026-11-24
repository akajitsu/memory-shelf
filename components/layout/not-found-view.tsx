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
      <BookX className="size-10 text-moon drop-shadow-[0_0_12px_rgb(232_215_139/0.5)]" aria-hidden />
      <h1 className="title-gilt font-ornate text-[32px] leading-tight font-normal sm:text-[42px]">This page isn’t on the shelf</h1>
      <p className="max-w-md text-sm text-silver/80">
        The album or page you’re looking for doesn’t exist, or it belongs to someone else’s library.
      </p>
      <Link
        href="/library"
        className="mt-2 inline-flex h-11 items-center rounded-full bg-moon px-6 text-sm font-semibold text-abyss transition-colors hover:bg-[#f0e3a6]"
      >
        Back to your library
      </Link>
    </div>
  );
}
