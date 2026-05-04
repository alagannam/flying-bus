select
  yb.badge_slug,
  yb.awarded_at
from public.youth_badges yb
where yb.user_id = (
  select user_id
  from public.youth_profiles
  where username = 'test13'
)
order by yb.awarded_at desc;
