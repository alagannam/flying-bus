delete from public.youth_badges
where user_id = (
  select user_id
  from public.youth_profiles
  where username = 'test12'
)
and badge_slug = (
  select item_ref
  from public.shop_items
  where slug = 'shop_pioneer'
);