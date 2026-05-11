select
  p.email as parent_email,
  yp.username,
  yp.display_name,
  gl.status
from public.guardian_links gl
join auth.users p
  on p.id = gl.parent_user_id
join public.youth_profiles yp
  on yp.user_id = gl.child_user_id
where p.email = 'parent1@test.com';