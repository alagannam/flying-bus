select
  title,
  status,
  published_at
from public.submissions
where youth_user_id = (
  select user_id
  from public.youth_profiles
  where username = 'test12'
)
order by published_at desc nulls last
limit 15;