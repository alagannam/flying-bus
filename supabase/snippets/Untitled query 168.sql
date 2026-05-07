insert into public.notifications (
  user_id,
  type,
  title,
  body,
  read_at
)
select
  yp.user_id,
  'parent_approved',
  'Dashboard unread test',
  'This notification should appear unread on the dashboard.',
  null
from public.youth_profiles yp
where yp.username = 'test12';