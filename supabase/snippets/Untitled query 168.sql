select
  type,
  title,
  body,
  read_at
from public.notifications
where user_id = (
  select id
  from auth.users
  where email = 'parent1@test.com'
)
order by created_at desc
limit 5;