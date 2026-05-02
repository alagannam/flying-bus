select a.email, u.account_type, u.account_status
from public.users u
join auth.users a
  on a.id = u.id
where a.email = 'parent1@test.com';