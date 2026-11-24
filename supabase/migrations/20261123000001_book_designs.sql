-- =============================================================================
-- Memory Shelf — physical book designs
--
-- Album exteriors are now designed books (a binding style and a tooled pattern on
-- a leather color) instead of showing a cover photograph. Additive only: existing
-- albums get the 'classic' design with no pattern, and nothing is deleted.
-- (albums.cover_image_path is kept so existing data is preserved; the app no
-- longer displays or sets it. Album deletion still removes those files.)
--
-- Apply in the Supabase SQL Editor, after 20261122000002_explicit_grants.sql.
-- =============================================================================

alter table public.albums
  add column if not exists cover_design text not null default 'classic',
  add column if not exists cover_pattern text not null default 'none';

alter table public.albums
  drop constraint if exists albums_cover_design_check,
  add constraint albums_cover_design_check
    check (cover_design in ('classic', 'celestial', 'arch', 'astrolabe'));

alter table public.albums
  drop constraint if exists albums_cover_pattern_check,
  add constraint albums_cover_pattern_check
    check (cover_pattern in ('none', 'stars', 'constellations', 'filigree', 'moons'));

comment on column public.albums.cover_design is 'Exterior binding style of the album book.';
comment on column public.albums.cover_pattern is 'Tooled pattern on the album cover and spine.';

-- This project does not auto-grant new columns: allow exactly these two to be set.
grant insert (cover_design, cover_pattern) on public.albums to authenticated;
grant update (cover_design, cover_pattern) on public.albums to authenticated;
