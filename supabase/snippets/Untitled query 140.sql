SELECT supabase_functions.http_post(
  'http://127.0.0.1:54321/auth/v1/admin/users/' || id || '',
  '{"password":"TestPass123!"}',
  json_build_object(
    'Content-Type', 'application/json',
    'apikey', 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
    'Authorization', 'Bearer sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
  )::text
)
FROM auth.users
WHERE email = 'alagannam@hotmail.com';
