"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createAlbum, finalizeCoverUpload, removeCover, requestCoverUpload, updateAlbum } from "@/lib/albums/actions";
import { albumFieldsSchema } from "@/lib/albums/validation";
import { fieldErrors as toFieldErrors } from "@/lib/auth/validation";
import { DEFAULT_COVER_COLOR } from "@/lib/constants";
import { ImagePrepError, prepareImage } from "@/lib/images/prepare";
import { uploadWithProgress } from "@/lib/images/upload";
import { BOOK_OPEN, NAV_BACK } from "@/components/layout/page-transition";
import { setBookHandoff } from "@/lib/book-handoff";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils";
import { AlbumCover } from "./album-cover";
import { CoverColorPicker } from "./cover-color-picker";
import { CoverImageInput } from "./cover-image-input";

type Initial = {
  id: string;
  title: string;
  description: string | null;
  coverColor: string;
  coverUrl: string | null;
};

function withoutKey(obj: Record<string, string>, key: string) {
  const next = { ...obj };
  delete next[key];
  return next;
}

type Phase ={ kind: "idle" } | { kind: "saving" } | { kind: "uploading"; progress: number };

/** Upload a cover for an album that already exists. Throws with a user-facing message. */
async function uploadCover(albumId: string, file: File, onProgress: (p: number) => void) {
  const prepared = await prepareImage(file, { maxDim: 1600, quality: 0.88 });
  const target = await requestCoverUpload({ albumId, contentType: prepared.type, size: prepared.blob.size });
  if (!target.ok) throw new Error(target.error);
  await uploadWithProgress(target.data.signedUrl, prepared.blob, prepared.type, onProgress);
  const done = await finalizeCoverUpload({ albumId, path: target.data.path });
  if (!done.ok) throw new Error(done.error);
}

export function AlbumForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverColor, setCoverColor] = useState(initial?.coverColor ?? DEFAULT_COVER_COLOR);
  const [cover, setCoverState] = useState<{ file: File; url: string } | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const coverUrlRef = useRef<string | null>(null);
  const coverFile = cover?.file ?? null;
  const localPreview = cover?.url ?? null;

  /** Swap the selected cover, releasing the previous preview's object URL. */
  function setCover(file: File | null) {
    if (coverUrlRef.current) URL.revokeObjectURL(coverUrlRef.current);
    const next = file ? { file, url: URL.createObjectURL(file) } : null;
    coverUrlRef.current = next?.url ?? null;
    setCoverState(next);
  }

  useEffect(() => () => {
    if (coverUrlRef.current) URL.revokeObjectURL(coverUrlRef.current);
  }, []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const busy = phase.kind !== "idle";
  const previewUrl = localPreview ?? (removeExisting ? null : (initial?.coverUrl ?? null));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);

    const values = { title, description, coverColor };
    const parsed = albumFieldsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});

    // Decode the cover before saving anything, so a bad file fails early.
    if (coverFile) {
      try {
        await prepareImage(coverFile, { maxDim: 1600 });
      } catch (err) {
        setFormError(err instanceof ImagePrepError ? err.message : "That cover photo can’t be used.");
        return;
      }
    }

    setPhase({ kind: "saving" });
    const result = isEdit ? await updateAlbum(initial.id, values) : await createAlbum(values);
    if (!result.ok) {
      setPhase({ kind: "idle" });
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      return;
    }
    const albumId = result.data.id;

    try {
      if (coverFile) {
        setPhase({ kind: "uploading", progress: 0 });
        await uploadCover(albumId, coverFile, (p) => setPhase({ kind: "uploading", progress: p }));
      } else if (isEdit && removeExisting && initial.coverUrl) {
        const removed = await removeCover(albumId);
        if (!removed.ok) throw new Error(removed.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "The cover photo couldn’t be saved.";
      toast.error(`${isEdit ? "Changes saved" : "Album created"}, but the cover photo wasn’t: ${msg}`);
    }

    setBookHandoff({ id: albumId, title: values.title, coverColor: values.coverColor, coverUrl: null });
    router.push(`/albums/${albumId}?${isEdit ? "saved" : "created"}=1`, {
      transitionTypes: isEdit ? NAV_BACK : BOOK_OPEN,
    });
  }

  const submitLabel =
    phase.kind === "saving"
      ? isEdit
        ? "Saving…"
        : "Creating album…"
      : phase.kind === "uploading"
        ? `Uploading cover… ${Math.round(phase.progress * 100)}%`
        : isEdit
          ? "Save changes"
          : "Create album";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-6 rounded-2xl border border-parchment bg-ivory p-5 shadow-[var(--shadow-paper)] sm:p-8"
      >
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <Field
          label="Title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => withoutKey(prev, "title"));
          }}
          maxLength={120}
          required
          autoFocus={!isEdit}
          placeholder="Summer in Lisbon"
          error={errors.title}
          disabled={busy}
        />

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="album-description" className="text-sm font-medium text-ink">
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <span className="text-xs text-muted tabular-nums">{description.length}/1000</span>
          </div>
          <textarea
            id="album-description"
            name="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => withoutKey(prev, "description"));
            }}
            maxLength={1000}
            rows={4}
            disabled={busy}
            placeholder="A few words about these memories…"
            aria-invalid={errors.description ? true : undefined}
            className={cn(inputClass, "h-auto resize-y py-2.5 leading-relaxed")}
          />
          {errors.description && (
            <p className="text-[13px] text-danger" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <CoverColorPicker value={coverColor} onChange={setCoverColor} />

        <CoverImageInput
          previewUrl={previewUrl}
          disabled={busy}
          onSelect={(file) => {
            setCover(file);
            setRemoveExisting(false);
          }}
          onRemove={() => {
            setCover(null);
            setRemoveExisting(true);
          }}
        />

        {phase.kind === "uploading" && (
          <div
            className="h-1.5 overflow-hidden rounded-full bg-parchment"
            role="progressbar"
            aria-label="Cover upload progress"
            aria-valuenow={Math.round(phase.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${phase.progress * 100}%` }} />
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href={isEdit ? `/albums/${initial.id}` : "/library"}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-ink hover:bg-parchment/60",
              busy && "pointer-events-none opacity-50",
            )}
          >
            Cancel
          </Link>
          <Button type="submit" size="lg" loading={busy} className="sm:min-w-44">
            {submitLabel}
          </Button>
        </div>
      </form>

      <aside className="order-first lg:order-none" aria-label="Cover preview">
        <p className="mb-3 text-center text-xs tracking-[0.18em] text-gold-soft/70 uppercase">Preview</p>
        <div className="mx-auto w-36 sm:w-52 lg:sticky lg:top-24 lg:w-full">
          <AlbumCover title={title} color={coverColor} imageUrl={previewUrl} />
        </div>
      </aside>
    </div>
  );
}
