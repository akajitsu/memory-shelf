-- =============================================================================
-- Memory Shelf — initial schema
-- Tables, ownership constraints, triggers, indexes, Row Level Security,
-- and the private `album-photos` storage bucket with ownership policies.
--
-- Safe to run once on a fresh Supabase project (SQL Editor or `supabase db push`).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- PROFILES — one row per auth user, created automatically on sign-up
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  email       text,
  avatar_url  text check (char_length(avatar_url) <= 2048),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for each authenticated user.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile whenever a user registers (email/password or Google OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), 2048)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their auth email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- ALBUMS
-- -----------------------------------------------------------------------------

create table public.albums (
  id                uuid primary key default gen_random_uuid(),
  -- Defaults to the caller; RLS rejects any other value.
  user_id           uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title             text not null check (char_length(btrim(title)) between 1 and 120),
  description       text check (char_length(description) <= 1000),
  cover_image_path  text,
  cover_color       text not null default '#7a4b2a' check (cover_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Allows album_photos to reference (album, owner) as a pair.
  constraint albums_id_user_id_key unique (id, user_id),
  -- Cover images must live inside this album's own storage folder.
  constraint albums_cover_path_in_own_folder check (
    cover_image_path is null
    or cover_image_path like (user_id::text || '/' || id::text || '/%')
  )
);

comment on table public.albums is 'Photo albums ("books") owned by a single user.';

create index albums_user_id_created_at_idx on public.albums (user_id, created_at desc);

create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ALBUM_PHOTOS
-- -----------------------------------------------------------------------------

create table public.album_photos (
  id             uuid primary key default gen_random_uuid(),
  album_id       uuid not null,
  user_id        uuid not null default auth.uid(),
  image_path     text not null unique,
  image_name     text check (char_length(image_name) <= 255),
  caption        text check (char_length(caption) <= 500),
  display_order  integer not null default 0 check (display_order >= 0),
  created_at     timestamptz not null default now(),

  -- A photo's owner must be its album's owner. Deleting an album deletes its photo rows.
  constraint album_photos_album_owner_fkey
    foreign key (album_id, user_id) references public.albums (id, user_id) on delete cascade,
  -- Images must live inside this album's own storage folder.
  constraint album_photos_path_in_own_folder check (
    image_path like (user_id::text || '/' || album_id::text || '/%')
  )
);

comment on table public.album_photos is 'Photographs in an album. Binaries live in Storage; this holds paths and metadata.';

create index album_photos_album_id_display_order_idx on public.album_photos (album_id, display_order);
create index album_photos_user_id_idx on public.album_photos (user_id);

-- -----------------------------------------------------------------------------
-- Column-level privileges: clients may only change user-editable columns.
-- (RLS decides which rows; these grants decide which columns.)
-- -----------------------------------------------------------------------------

revoke all on public.profiles, public.albums, public.album_photos from anon;

revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

revoke update on public.albums from authenticated;
grant update (title, description, cover_image_path, cover_color) on public.albums to authenticated;

revoke update on public.album_photos from authenticated;
grant update (caption, display_order) on public.album_photos to authenticated;

-- Profiles are created only by the trigger and removed only with the auth user.
revoke insert, delete on public.profiles from authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

-- PROFILES: a user sees and edits only their own profile.
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ALBUMS: full CRUD on own rows only.
create policy "Users can view their own albums"
  on public.albums for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own albums"
  on public.albums for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own albums"
  on public.albums for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own albums"
  on public.albums for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ALBUM_PHOTOS: own rows, and only inside albums the user owns.
create policy "Users can view photos in their own albums"
  on public.album_photos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add photos to their own albums"
  on public.album_photos for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.albums a
      where a.id = album_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can update photos in their own albums"
  on public.album_photos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete photos in their own albums"
  on public.album_photos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- RPC: reorder photos atomically. Runs as the caller, so RLS still applies.
-- p_photo_ids is the full desired order; positions become 0..n-1.
-- -----------------------------------------------------------------------------

create or replace function public.reorder_album_photos(p_album_id uuid, p_photo_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.album_photos p
  set display_order = o.ordinality - 1
  from unnest(p_photo_ids) with ordinality as o (photo_id, ordinality)
  where p.id = o.photo_id
    and p.album_id = p_album_id
    and p.user_id = (select auth.uid());
end;
$$;

revoke execute on function public.reorder_album_photos(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_album_photos(uuid, uuid[]) to authenticated;

-- Trigger functions must not be callable as RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- STORAGE: private bucket `album-photos`
-- Path layout:  {user_id}/{album_id}/{random}.{ext}
-- Covers:       {user_id}/{album_id}/cover-{random}.{ext}
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'album-photos',
  'album-photos',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Read: only files in your own top-level folder.
create policy "Users can read their own album files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'album-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Upload: only into a folder for an album you own.
create policy "Users can upload into their own albums"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'album-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.albums a
      where a.id::text = (storage.foldername(name))[2]
        and a.user_id = (select auth.uid())
    )
  );

-- Delete: only files in your own folder (works even after the album row is gone,
-- so album deletion can clean up its files).
create policy "Users can delete their own album files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'album-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- No UPDATE policy: files are immutable; replacing means delete + upload.
