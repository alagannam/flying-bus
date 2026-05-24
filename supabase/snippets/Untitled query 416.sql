select
  id,
  title,
  status
from public.submissions
where status = 'published'
order by published_at desc nulls last, created_at desc
limit 10;