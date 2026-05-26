INSERT INTO challenges (slug, title, description, category, starts_at, ends_at, is_active, sort_order)
VALUES (
  'my-favorite-place',
  'Tell us about a place you love',
  'Write a short story, poem, or description of your favorite place in the world. It could be a city, a room, a park, or anywhere that matters to you. Any format — just make it yours.',
  'Story Relay',
  now(),
  now() + interval '7 days',
  true,
  1
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  ends_at = EXCLUDED.ends_at,
  is_active = true;