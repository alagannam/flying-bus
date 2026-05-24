select
  a.email,
  u.account_status
from public.users u
join auth.users a
  on a.id = u.id
where u.id = 'bd9b689e-abeb-498d-a9fe-50c852187013';