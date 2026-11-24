"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { ImagePlus, Images, X } from "lucide-react";
import { toast } from "sonner";
import { createAlbum, updateAlbum } from "@/lib/albums/actions";
import { albumFieldsSchema } from "@/lib/albums/validation";
import { fieldErrors as toFieldErrors } from "@/lib/auth/validation";
import { ALLOWED_IMAGE_TYPES, MAX_FILES_PER_UPLOAD } from "@/lib/constants";
import { DEFAULT_BOOK, DESIGN_INFO, type BookDesign, type BookPattern } from "@/lib/book-design";
import { checkImageFile, ImagePrepError } from "@/lib/images/prepare";
import { uploadPhotoFiles } from "@/lib/photos/upload-client";
import { BOOK_OPEN, NAV_BACK } from "@/components/layout/page-transition";
import { setBookHandoff } from "@/lib/book-handoff";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils";
import { BookPreview } from "./book-preview";
import { DesignPicker, PatternPicker } from "./book-design-picker";
import { CoverColorPicker } from "./cover-color-picker";

type Initial = {
  id: string;
  title: string;
  description: string | null;
  coverColor: string;
  coverDesign: BookDesign;
  coverPattern: BookPattern;
};

type Queued = { key: string; file: File; preview: string };

function withoutKey(obj: Record<string, string>, key: string) {
  const next = { ...obj };
  delete next[key];
  return next;
}

type Phase = { kind: "idle" } | { kind: "saving" } | { kind: "uploading"; progress: number };

let keySeq = 0;

/**
 * Photographs chosen while creating the album. They are uploaded into the book's
 * pages once it exists — never used on the cover.
 */
function PagePhotosInput({
  items,
  onAdd,
  onRemove,
  disabled,
}: {
  items: Queued[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled && e.dataTransfer.files?.length) onAdd(Array.from(e.dataTransfer.files));
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-wide text-silver">
          Photographs for the pages <span className="font-normal text-silver/60">(optional)</span>
        </span>
        {items.length > 0 && <span className="text-xs text-silver/60 tabular-nums">{items.length} chosen</span>}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-2xl border border-dashed p-3 transition-colors",
          dragging ? "border-aurora bg-aurora/[0.08]" : "border-ivory/15 bg-abyss/40",
        )}
      >
        {items.length > 0 && (
          <ul className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Photographs to add">
            {items.map((it) => (
              <li key={it.key} className="relative">
                {/* Local preview of a file the reader just picked. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="aspect-square w-full rounded-lg object-cover" />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemove(it.key)}
                    aria-label={`Remove ${it.file.name}`}
                    className="absolute -top-1.5 -right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full border border-ivory/15 bg-cosmos text-silver hover:bg-danger-strong hover:text-ivory"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3 px-1">
          <Images className="size-5 text-aurora" aria-hidden />
          <p className="text-sm text-silver">
            {items.length ? "Add more, or drop them here." : "Drop photos here, or"}{" "}
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer font-semibold text-aurora underline-offset-4 hover:underline disabled:opacity-50"
            >
              choose from your files
            </button>
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Photographs for the album pages"
          onChange={(e) => {
            if (e.target.files) onAdd(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-[13px] text-silver/65">
        They’ll be arranged on the pages inside the book. You can reorder and caption them later.
      </p>
    </div>
  );
}

export function AlbumForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverColor, setCoverColor] = useState(initial?.coverColor ?? DEFAULT_BOOK.color);
  const [coverDesign, setCoverDesign] = useState<BookDesign>(initial?.coverDesign ?? DEFAULT_BOOK.design);
  const [coverPattern, setCoverPattern] = useState<BookPattern>(initial?.coverPattern ?? DEFAULT_BOOK.pattern);
  const [queued, setQueued] = useState<Queued[]>([]);
  const queuedRef = useRef(queued);
  useEffect(() => {
    queuedRef.current = queued;
  }, [queued]);
  useEffect(() => () => queuedRef.current.forEach((q) => URL.revokeObjectURL(q.preview)), []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const busy = phase.kind !== "idle";

  async function addPhotos(files: File[]) {
    const room = MAX_FILES_PER_UPLOAD - queuedRef.current.length;
    if (files.length > room) toast.error(`You can add up to ${MAX_FILES_PER_UPLOAD} photos here; add more after the album is created.`);
    const accepted: Queued[] = [];
    const rejected: string[] = [];
    for (const file of files.slice(0, Math.max(0, room))) {
      try {
        await checkImageFile(file);
        accepted.push({ key: `q${++keySeq}`, file, preview: URL.createObjectURL(file) });
      } catch (e) {
        rejected.push(e instanceof ImagePrepError ? `${file.name}: ${e.message}` : `${file.name} can’t be used.`);
      }
    }
    if (rejected.length) toast.error(rejected.join(" "));
    setQueued((q) => [...q, ...accepted]);
  }

  function removePhoto(key: string) {
    setQueued((q) => {
      const it = q.find((x) => x.key === key);
      if (it) URL.revokeObjectURL(it.preview);
      return q.filter((x) => x.key !== key);
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);

    const values = { title, description, coverColor, coverDesign, coverPattern };
    const parsed = albumFieldsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setPhase({ kind: "saving" });
    const result = isEdit ? await updateAlbum(initial.id, values) : await createAlbum(values);
    if (!result.ok) {
      setPhase({ kind: "idle" });
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      return;
    }
    const albumId = result.data.id;

    // Fill the new book's pages with the chosen photographs.
    if (!isEdit && queued.length) {
      setPhase({ kind: "uploading", progress: 0 });
      const progress = new Map<string, number>();
      const res = await uploadPhotoFiles(albumId, queued, (key, u) => {
        progress.set(key, u.status === "done" ? 1 : (u.progress ?? progress.get(key) ?? 0));
        const total = [...progress.values()].reduce((a, b) => a + b, 0) / queued.length;
        setPhase({ kind: "uploading", progress: total });
      });
      const failed = queued.length - res.added;
      if (res.error || failed > 0) {
        toast.error(
          `Album created, but ${failed} ${failed === 1 ? "photo wasn’t" : "photos weren’t"} added${res.error ? `: ${res.error}` : "."} You can add them from “Add & arrange photos”.`,
        );
      }
    }

    setBookHandoff({ id: albumId, title: values.title, coverColor, coverDesign, coverPattern });
    router.push(`/albums/${albumId}?${isEdit ? "saved" : "created"}=1`, {
      transitionTypes: isEdit ? NAV_BACK : BOOK_OPEN,
    });
  }

  const submitLabel =
    phase.kind === "saving"
      ? isEdit
        ? "Saving…"
        : "Binding your album…"
      : phase.kind === "uploading"
        ? `Placing photographs… ${Math.round(phase.progress * 100)}%`
        : isEdit
          ? "Save changes"
          : "Create album";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:gap-12">
      <form onSubmit={onSubmit} noValidate className="night-panel space-y-7 rounded-3xl p-5 sm:p-8">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <div className="space-y-5">
          <p className="eyebrow text-aurora/80">The story</p>
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
              <label htmlFor="album-description" className="text-[13px] font-semibold tracking-wide text-silver">
                Description <span className="font-normal text-silver/60">(optional)</span>
              </label>
              <span className="text-xs text-silver/60 tabular-nums">{description.length}/1000</span>
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
              rows={3}
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
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-ivory/12 to-transparent" />

        <div className="space-y-6">
          <div>
            <p className="eyebrow text-aurora/80">The book</p>
            <p className="mt-1.5 text-[13px] text-silver/70">
              Choose how the volume looks on your shelf. Photographs stay inside, on the pages.
            </p>
          </div>
          <DesignPicker value={coverDesign} color={coverColor} pattern={coverPattern} onChange={setCoverDesign} />
          <CoverColorPicker value={coverColor} onChange={setCoverColor} />
          <PatternPicker value={coverPattern} color={coverColor} onChange={setCoverPattern} />
        </div>

        {!isEdit && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-ivory/12 to-transparent" />
            <PagePhotosInput items={queued} onAdd={(f) => void addPhotos(f)} onRemove={removePhoto} disabled={busy} />
          </>
        )}

        {isEdit && (
          <p className="text-[13px] text-silver/70">
            To add, reorder or caption photographs, use{" "}
            <Link href={`/albums/${initial.id}/photos`} className="font-semibold text-aurora underline-offset-4 hover:underline">
              Add &amp; arrange photos
            </Link>
            .
          </p>
        )}

        {phase.kind === "uploading" && (
          <div
            className="h-1.5 overflow-hidden rounded-full bg-abyss/70"
            role="progressbar"
            aria-label="Photo upload progress"
            aria-valuenow={Math.round(phase.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-gradient-to-r from-aurora to-moon transition-[width] duration-200"
              style={{ width: `${phase.progress * 100}%` }}
            />
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Link
            href={isEdit ? `/albums/${initial.id}` : "/library"}
            transitionTypes={NAV_BACK}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-silver transition-colors hover:bg-white/[0.06] hover:text-ivory",
              busy && "pointer-events-none opacity-50",
            )}
          >
            Cancel
          </Link>
          <Button type="submit" size="lg" loading={busy} className="sm:min-w-48">
            {!busy && !isEdit && <ImagePlus className="size-4" aria-hidden />}
            {submitLabel}
          </Button>
        </div>
      </form>

      <aside className="order-first lg:order-none" aria-label="Book preview">
        <div className="lg:sticky lg:top-24">
          <p className="eyebrow text-center text-silver/60">Your book</p>
          <BookPreview look={{ title, color: coverColor, design: coverDesign, pattern: coverPattern }} />
          <p className="text-center font-serif text-lg text-ivory/90 italic">{DESIGN_INFO[coverDesign].name} binding</p>
          <p className="mt-1 text-center text-xs text-silver/60">{DESIGN_INFO[coverDesign].description}</p>
        </div>
      </aside>
    </div>
  );
}
