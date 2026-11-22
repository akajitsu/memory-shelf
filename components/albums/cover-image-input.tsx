"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { checkImageFile, ImagePrepError } from "@/lib/images/prepare";
import { cn } from "@/lib/utils";

/** Pick or drop a single cover image. Validates by file contents before accepting. */
export function CoverImageInput({
  previewUrl,
  onSelect,
  onRemove,
  disabled,
}: {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      await checkImageFile(file);
      onSelect(file);
    } catch (e) {
      setError(e instanceof ImagePrepError ? e.message : "That file can’t be used.");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) void accept(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-ink">
        Cover photo <span className="font-normal text-muted">(optional)</span>
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex items-center gap-4 rounded-lg border border-dashed p-3 transition-colors",
          dragging ? "border-gold bg-gold/10" : "border-parchment bg-ivory",
        )}
      >
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-parchment/60">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected cover" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-ink">{previewUrl ? "Cover photo selected" : "Drag a photo here, or"}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer font-medium text-leather underline-offset-4 hover:underline disabled:opacity-50"
            >
              {previewUrl ? "Choose another" : "browse your files"}
            </button>
            {previewUrl && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setError(null);
                  onRemove();
                }}
                className="inline-flex cursor-pointer items-center gap-1 text-muted hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden /> Remove
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Cover photo file"
          onChange={(e) => {
            void accept(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-[13px] text-muted">JPEG, PNG, WebP or GIF. Large photos are resized automatically.</p>
      )}
    </div>
  );
}
