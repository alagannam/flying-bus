insert into public.user_roles (
  user_id,
  role,
  scope_type,
  scope_id,
  granted_by
)
values (
  (select id from auth.users where email = 'test12@test.com'),
  'moderator',
  'club',
  '5ad005c1-b81e-4828-aac4-51a1ac2b76fd',
  '76166f5b-5578-418e-a1cd-aa912c4f7632'
);