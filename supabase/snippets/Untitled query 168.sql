select
  title,
  type,
  read_at
from public.notifications
where user_id = (
  select user_id
  from public.youth_profiles
  where username = 'test12'
)
order by created_at desc
limit 10;