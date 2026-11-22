import { foilFor } from "@/lib/bookshelf";
import { cn } from "@/lib/utils";

/**
 * Front cover of a leather album, viewed face-on. Scales with its container
 * (font sizes use container-query units). Works in server and client components.
 */
export function AlbumCover({
  title,
  color,
  imageUrl,
  className,
  fill = false,
}: {
  title: string;
  color: string;
  imageUrl?: string | null;
  className?: string;
  /** Fill the parent exactly instead of using the 4:5 aspect ratio. */
  fill?: boolean;
}) {
  const foil = foilFor(color);
  const display = title.trim() || "Untitled album";

  return (
    <div
      className={cn(
        "@container relative overflow-hidden rounded-r-[6px] rounded-l-[3px]",
        fill ? "size-full" : "aspect-[4/5] w-full",
        className,
      )}
      style={{
        backgroundColor: color,
        backgroundImage:
          "linear-gradient(90deg, rgb(0 0 0 / 0.45) 0%, rgb(0 0 0 / 0.15) 6%, rgb(255 255 255 / 0.06) 8%, transparent 14%), " +
          "linear-gradient(155deg, rgb(255 255 255 / 0.1), transparent 40%, rgb(0 0 0 / 0.18))",
        boxShadow:
          "0 30px 50px -20px rgb(0 0 0 / 0.75), 0 10px 18px -8px rgb(0 0 0 / 0.5), inset 0 0 0 1px rgb(0 0 0 / 0.3)",
      }}
    >
      {/* Hinge groove */}
      <span className="absolute inset-y-0 left-[7%] w-px bg-black/30" aria-hidden />
      <span className="absolute inset-y-0 left-[7.4%] w-px bg-white/10" aria-hidden />

      {/* Foil frame */}
      <div
        className="absolute inset-y-[5.5%] right-[6%] left-[13%] flex flex-col items-center"
        style={{ border: `1px solid ${foil.band}`, boxShadow: `inset 0 0 0 3px ${color}, inset 0 0 0 4px ${foil.band}` }}
      >
        {imageUrl ? (
          <>
            <div className="mt-[9%] w-[74%] bg-black/20 p-[2.5%]" style={{ border: `1px solid ${foil.band}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="aspect-[4/5] w-full object-cover" draggable={false} />
            </div>
            <p
              className="mt-auto mb-[9%] line-clamp-2 px-[8%] text-center font-serif leading-tight font-medium"
              style={{ color: foil.text, fontSize: "clamp(10px, 8.5cqw, 34px)", textShadow: "0 1px 0 rgb(0 0 0 / 0.35)" }}
            >
              {display}
            </p>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-[6%] px-[9%] text-center">
            <span className="h-px w-[40%]" style={{ background: foil.band }} aria-hidden />
            <p
              className="line-clamp-4 font-serif leading-[1.1] font-medium"
              style={{ color: foil.text, fontSize: "clamp(12px, 11cqw, 44px)", textShadow: "0 1px 0 rgb(0 0 0 / 0.35)" }}
            >
              {display}
            </p>
            <span className="h-px w-[40%]" style={{ background: foil.band }} aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
