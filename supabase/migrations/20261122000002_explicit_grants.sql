-- =============================================================================
-- Memory Shelf — explicit table privileges
--
-- Newer Supabase projects do not auto-grant anon/authenticated access to new
-- tables in `public`. Grant exactly what the app needs, column by column.
-- RLS (from the initial migration) still decides WHICH ROWS a user can touch;
-- these grants decide WHICH COLUMNS and operations are possible at all.
-- =============================================================================

grant usage on schema public to authenticated;

-- PROFILES: read own row (RLS), edit name/avatar. Rows are created by trigger.
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ALBUMS: user_id and id are not insertable — they come from defaults
-- (auth.uid() and gen_random_uuid()), so a client cannot spoof ownership.
grant select, delete on public.albums to authenticated;
grant insert (title, description, cover_color) on public.albums to authenticated;
grant update (title, description, cover_image_path, cover_color) on public.albums to authenticated;

-- ALBUM_PHOTOS: user_id is not insertable — it defaults to auth.uid(), and the
-- composite foreign key requires it to match the album's owner.
grant select, delete on public.album_photos to authenticated;
grant insert (album_id, image_path, image_name, caption, display_order) on public.album_photos to authenticated;
grant update (caption, display_order) on public.album_photos to authenticated;

-- anon gets nothing on these tables.
revoke all on public.profiles, public.albums, public.album_photos from anon;
