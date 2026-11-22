import { z } from "zod";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";

export const albumIdSchema = z.uuid("Invalid album.");

export const albumFieldsSchema = z.object({
  title: z.string().trim().min(1, "Give your album a title.").max(120, "Use 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Use 1,000 characters or fewer.")
    .transform((v) => (v === "" ? null : v)),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a cover color."),
});

export type AlbumFields = z.input<typeof albumFieldsSchema>;

export const uploadRequestSchema = z.object({
  albumId: albumIdSchema,
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  size: z.number().int().positive().max(MAX_IMAGE_BYTES, "Files must be 10 MB or smaller."),
});
