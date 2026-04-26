update public.users
set account_type = 'editor'
where id = (
  select id
  from auth.users
  where email = 'editor@test.com'
);