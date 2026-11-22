"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAlbum } from "@/lib/albums/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteAlbumButton({ albumId, title, photoCount }: { albumId: string; title: string; photoCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      // On success the action redirects to the bookshelf.
      const result = await deleteAlbum(albumId);
      if (result && !result.ok) {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete this album"
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm sm:px-3.5 text-ivory/70 transition-colors hover:bg-danger/15 hover:text-[#f2b8ad]"
      >
        <Trash2 className="size-4" aria-hidden /> <span className="hidden sm:inline">Delete</span>
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        pending={pending}
        title="Delete this album?"
        confirmLabel={pending ? "Deleting…" : "Delete album"}
      >
        <p>
          <strong className="font-medium text-ink">“{title}”</strong>
          {photoCount > 0
            ? ` and its ${photoCount} ${photoCount === 1 ? "photograph" : "photographs"} will be permanently deleted.`
            : " will be permanently deleted."}{" "}
          This can’t be undone.
        </p>
      </ConfirmDialog>
    </>
  );
}
