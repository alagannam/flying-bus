select
  title,
  status,
  submitted_at
from public.submissions
where youth_user_id = (
  select user_id
  from public.youth_profiles
  where username = 'test12'
)
and title in ('parent', 'no approval')
order by submitted_at desc;