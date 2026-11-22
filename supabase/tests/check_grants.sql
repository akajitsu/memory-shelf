-- Shows which table/column privileges the API roles currently have.
-- Expected: every *_ok column is true.
select
  has_table_privilege('authenticated', 'public.albums', 'SELECT')                    as albums_select_ok,
  has_column_privilege('authenticated', 'public.albums', 'title', 'INSERT')          as albums_insert_title_ok,
  not has_column_privilege('authenticated', 'public.albums', 'user_id', 'INSERT')    as albums_user_id_locked_ok,
  has_table_privilege('authenticated', 'public.album_photos', 'SELECT')              as photos_select_ok,
  has_column_privilege('authenticated', 'public.album_photos', 'album_id', 'INSERT') as photos_insert_ok,
  has_table_privilege('authenticated', 'public.profiles', 'SELECT')                  as profiles_select_ok,
  not has_table_privilege('anon', 'public.albums', 'SELECT')                         as anon_locked_ok;
