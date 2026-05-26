INSERT INTO clubs (slug, name, description, mission, age_bands, is_active, sort_order)
VALUES
  ('story-relay', 'Story Relay', 'Build worlds together one story at a time. Each week a new chapter begins.', 'To grow young storytellers through collaborative creative writing.', ARRAY['8-10','11-13','14-18']::age_band[], true, 1),
  ('world-window', 'World Window', 'Share your city, culture, food, and everyday life with kids around the world.', 'To connect young people through curiosity about each other''s lives.', ARRAY['8-10','11-13','14-18']::age_band[], true, 2),
  ('challenge-arena', 'Challenge Arena', 'Weekly challenges in creativity, debate, design, and problem-solving.', 'To push young minds through friendly competition.', ARRAY['11-13','14-18']::age_band[], true, 3)
ON CONFLICT (slug) DO NOTHING;