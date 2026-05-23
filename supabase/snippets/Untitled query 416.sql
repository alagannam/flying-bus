update public.guardian_links
set publish_requires_approval = false
where child_user_id = (
  select user_id
  from public.youth_profiles
  where username = 'test12'
)
and status = 'active';