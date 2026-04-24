-- ============================================================
-- Development seed — NEVER apply to production.
-- Apply after all migrations with: supabase db reset
-- ============================================================

-- ── platform_config defaults ─────────────────────────────────

INSERT INTO platform_config (key, value) VALUES
  ('coin_earn_text_submission',    '10'),
  ('coin_earn_image_submission',   '15'),
  ('coin_earn_challenge_entry',    '25'),
  ('coin_earn_challenge_winner',   '50'),
  ('coin_earn_streak_7_day',       '5'),
  ('coin_spend_min_impact_vote',   '10'),
  ('max_revision_count',           '3'),
  ('review_queue_claim_timeout_minutes', '30')
ON CONFLICT (key) DO NOTHING;

-- ── Clubs ────────────────────────────────────────────────────

INSERT INTO clubs (slug, name, description, mission, age_bands, sort_order) VALUES
  (
    'story-relay',
    'Story Relay',
    'Build serialised stories, comics, and creative worlds together week by week.',
    'Every great story starts with one line. Add yours.',
    ARRAY['8-10','11-13','14-18']::age_band[],
    1
  ),
  (
    'world-window',
    'World Window',
    'Share your city, food, culture, hobbies, and everyday life with kids around the world.',
    'The world is full of amazing things. Show us yours.',
    ARRAY['8-10','11-13','14-18']::age_band[],
    2
  ),
  (
    'challenge-arena',
    'Challenge Arena',
    'Weekly and seasonal challenges in creativity, debate, kindness, and problem-solving.',
    'Compete, improve, and help others along the way.',
    ARRAY['8-10','11-13','14-18']::age_band[],
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Badges ───────────────────────────────────────────────────
-- Note: badges table is created in migration 006.
-- This seed block is commented out and uncommented after 006 is applied.

-- INSERT INTO badges (slug, name, description, icon_url, category, kana_cost) VALUES
--   ('first-post',       'First Story',       'Published your first piece of content.',        '/badges/first-post.svg',       'participation', 0),
--   ('week-1',           'Week One',          'Completed your first weekly mission.',           '/badges/week-1.svg',           'participation', 0),
--   ('streak-7',         'On a Roll',         'Logged in 7 days in a row.',                    '/badges/streak-7.svg',         'participation', 0),
--   ('editor-pick',      'Editor''s Pick',    'Your work was featured by an editor.',          '/badges/editor-pick.svg',      'creator',       0),
--   ('impact-voter',     'Mission Helper',    'Used Kana Coins to support an impact campaign.','/badges/impact-voter.svg',     'impact',        0),
--   ('global-reporter',  'Global Reporter',   'Published a World Window report.',              '/badges/global-reporter.svg',  'creator',       0)
-- ON CONFLICT (slug) DO NOTHING;
