select award_coins(
  (select user_id from public.youth_profiles where username = 'test12'),
  100,
  'admin_grant',
  null
);