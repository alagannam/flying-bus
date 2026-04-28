select
  p.email as parent_email,
  cy.username as child_username,
  gl.status,
  gl.publish_requires_approval,
  gl.spending_requires_approval
from public.guardian_links gl
join auth.users p
  on p.id = gl.parent_user_id
join public.youth_profiles cy
  on cy.user_id = gl.child_user_id
where p.email = 'parent1@test.com';