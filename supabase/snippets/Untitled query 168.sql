update public.users
set account_type = 'moderator',
    account_status = 'active'
where id = (
  select id
  from auth.users
  where email = 'parent1@test.com'
);
