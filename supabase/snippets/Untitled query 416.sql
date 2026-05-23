update public.user_roles
set revoked_at = now()
where user_id = (select id from auth.users where email = 'test12@test.com')
  and role = 'moderator'
  and scope_type = 'club';
  