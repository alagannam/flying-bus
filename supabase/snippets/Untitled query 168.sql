insert into public.audit_events (
  event_type,
  actor_user_id,
  target_type,
  target_id,
  payload
)
values (
  'role_revoked',
  null,
  'user_role',
  gen_random_uuid(),
  null
);