import { z } from "zod";
import { BOOK_DESIGNS, BOOK_PATTERNS } from "@/lib/book-design";

export const albumIdSchema = z.uuid("Invalid album.");

export const albumFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give your album a title.").max(120, "Use 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Use 1,000 characters or fewer.")
    .transform((v) => (v === "" ? null : v)),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a cover color."),
  coverDesign: z.enum(BOOK_DESIGNS, "Choose a book design."),
  coverPattern: z.enum(BOOK_PATTERNS, "Choose a pattern."),
});

export type AlbumFields = z.input<typeof albumFieldsSchema>;
