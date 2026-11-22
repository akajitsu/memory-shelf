-- =============================================================================
-- Memory Shelf — ownership & RLS test
--
-- Run in the Supabase SQL Editor AFTER the initial migration.
-- Creates two temporary users (A and B) and attempts cross-user access as B.
--
-- It ALWAYS ends with an error on purpose: raising an exception rolls back the
-- whole transaction, so no test users, albums, or storage rows are left behind.
-- Read the message:  "RLS TEST RESULT: N passed, 0 failed"  means success.
-- =============================================================================

do $$
declare
  user_a   uuid := gen_random_uuid();
  user_b   uuid := gen_random_uuid();
  album_a  uuid;
  album_b  uuid;
  photo_a  uuid;
  n        int;
  owner    uuid;
  passed   int := 0;
  failures text := '';
begin
  -- Two users; the trigger should create their profiles.
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (user_a, 'authenticated', 'authenticated', 'rls-test-a@example.invalid', '{"full_name":"Tester A"}', now(), now()),
    (user_b, 'authenticated', 'authenticated', 'rls-test-b@example.invalid', '{"full_name":"Tester B"}', now(), now());

  select count(*) into n from public.profiles where id in (user_a, user_b) and full_name like 'Tester %';
  if n = 2 then passed := passed + 1; else failures := failures || ' [profile trigger]'; end if;

  -- ---------------------------------------------------------------- act as A
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.albums (title) values ('A private album') returning id into album_a;
  insert into public.album_photos (album_id, image_path, image_name)
    values (album_a, user_a || '/' || album_a || '/one.jpg', 'one.jpg') returning id into photo_a;

  select user_id into owner from public.albums where id = album_a;
  if owner = user_a then passed := passed + 1; else failures := failures || ' [user_id default]'; end if;

  -- A cannot rewrite ownership columns.
  begin
    update public.albums set user_id = user_b where id = album_a;
    failures := failures || ' [A changed albums.user_id]';
  exception when insufficient_privilege then passed := passed + 1;
  end;

  -- A cannot store a photo path outside the album's folder.
  begin
    insert into public.album_photos (album_id, image_path) values (album_a, user_b || '/elsewhere/x.jpg');
    failures := failures || ' [path outside folder accepted]';
  exception when check_violation then passed := passed + 1;
  end;

  -- A can upload a storage object into their own album folder.
  begin
    insert into storage.objects (bucket_id, name, owner_id)
      values ('album-photos', user_a || '/' || album_a || '/one.jpg', user_a::text);
    passed := passed + 1;
  exception when others then failures := failures || ' [A own upload denied: ' || sqlerrm || ']';
  end;

  reset role;

  -- ---------------------------------------------------------------- act as B
  perform set_config('request.jwt.claims', json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.albums (title) values ('B album') returning id into album_b;

  select count(*) into n from public.albums where id = album_a;
  if n = 0 then passed := passed + 1; else failures := failures || ' [B can read A album]'; end if;

  select count(*) into n from public.album_photos where album_id = album_a;
  if n = 0 then passed := passed + 1; else failures := failures || ' [B can read A photos]'; end if;

  select count(*) into n from public.profiles;
  if n = 1 then passed := passed + 1; else failures := failures || ' [B sees other profiles]'; end if;

  update public.albums set title = 'hacked' where id = album_a;
  get diagnostics n = row_count;
  if n = 0 then passed := passed + 1; else failures := failures || ' [B updated A album]'; end if;

  delete from public.albums where id = album_a;
  get diagnostics n = row_count;
  if n = 0 then passed := passed + 1; else failures := failures || ' [B deleted A album]'; end if;

  update public.album_photos set caption = 'hacked' where id = photo_a;
  get diagnostics n = row_count;
  if n = 0 then passed := passed + 1; else failures := failures || ' [B edited A photo]'; end if;

  delete from public.album_photos where id = photo_a;
  get diagnostics n = row_count;
  if n = 0 then passed := passed + 1; else failures := failures || ' [B deleted A photo]'; end if;

  -- B creates an album claiming to be A.
  begin
    insert into public.albums (user_id, title) values (user_a, 'spoofed');
    failures := failures || ' [B spoofed user_id on album]';
  exception when insufficient_privilege then passed := passed + 1;  -- RLS violation
  end;

  -- B injects a photo into A's album (own user_id).
  begin
    insert into public.album_photos (album_id, image_path)
      values (album_a, user_b || '/' || album_a || '/inject.jpg');
    failures := failures || ' [B added photo to A album]';
  exception when insufficient_privilege or foreign_key_violation then passed := passed + 1;
  end;

  -- B injects a photo into A's album claiming A's user_id.
  begin
    insert into public.album_photos (album_id, user_id, image_path)
      values (album_a, user_a, user_a || '/' || album_a || '/inject.jpg');
    failures := failures || ' [B spoofed user_id on photo]';
  exception when insufficient_privilege then passed := passed + 1;
  end;

  -- B reorders A's photos via RPC: must have no effect (would move photo_a to position 1).
  perform public.reorder_album_photos(album_a, array[gen_random_uuid(), photo_a]);

  -- B cannot see or upload into A's storage folder.
  select count(*) into n from storage.objects where name like user_a || '/%';
  if n = 0 then passed := passed + 1; else failures := failures || ' [B can list A files]'; end if;

  begin
    insert into storage.objects (bucket_id, name, owner_id)
      values ('album-photos', user_a || '/' || album_a || '/evil.jpg', user_b::text);
    failures := failures || ' [B uploaded into A folder]';
  exception when insufficient_privilege then passed := passed + 1;
  end;

  -- B cannot upload into their own folder for an album they do not own.
  begin
    insert into storage.objects (bucket_id, name, owner_id)
      values ('album-photos', user_b || '/' || album_a || '/evil.jpg', user_b::text);
    failures := failures || ' [B uploaded under A album id]';
  exception when insufficient_privilege then passed := passed + 1;
  end;

  reset role;

  -- ------------------------------------------------- verify A's data survived
  perform set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.albums where id = album_a and title = 'A private album';
  if n = 1 then passed := passed + 1; else failures := failures || ' [A album altered]'; end if;

  select count(*) into n from public.album_photos where id = photo_a and caption is null and display_order = 0;
  if n = 1 then passed := passed + 1; else failures := failures || ' [A photo altered or reordered by B]'; end if;

  -- A's own reorder works.
  perform public.reorder_album_photos(album_a, array[gen_random_uuid(), photo_a]);
  select display_order into n from public.album_photos where id = photo_a;
  if n = 1 then passed := passed + 1; else failures := failures || ' [A reorder had no effect]'; end if;

  select count(*) into n from public.albums where id = album_b;
  if n = 0 then passed := passed + 1; else failures := failures || ' [A can read B album]'; end if;

  -- Deleting A's album cascades to its photo rows.
  delete from public.albums where id = album_a;
  select count(*) into n from public.album_photos where album_id = album_a;
  if n = 0 then passed := passed + 1; else failures := failures || ' [photo rows not cascaded]'; end if;

  reset role;

  raise exception 'RLS TEST RESULT: % passed, % failed.%  (Transaction rolled back intentionally — nothing was saved.)',
    passed,
    length(failures) - length(replace(failures, ' [', ' ')),
    case when failures = '' then '' else ' Failures:' || failures end;
end;
$$;
