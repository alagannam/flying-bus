select award_coins(
  (select user_id from public.youth_profiles where username = 'test1'),
  200,
  'admin_grant',
  null
);