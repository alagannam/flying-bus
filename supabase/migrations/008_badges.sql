-- ============================================================
-- Migration 008: Badges
-- Depends on: 001 (users)
-- badge_definitions is the admin-seeded catalog.
-- youth_badges is the per-user earned record.
-- All writes to youth_badges go through service-role server
-- actions only. No client-side insert/update/delete.
-- ============================================================

-- ── badge_definitions ─────────────────────────────────────────

CREATE TABLE badge_definitions (
  slug           text PRIMARY KEY
                   CHECK (slug ~ '^[a-z0-9_]+$'),
  name           text NOT NULL,
  description    text NOT NULL,
  icon_emoji     text NOT NULL DEFAULT '🏅',

  -- How the badge is earned.
  -- 'submissions_published' | 'creator_score' | 'streak_current'
  -- | 'coins_balance' | 'manual'
  criteria_type  text NOT NULL
                   CHECK (criteria_type IN (
                     'submissions_published',
                     'creator_score',
                     'streak_current',
                     'coins_balance',
                     'manual'
                   )),

  -- The numeric threshold that must be reached or exceeded.
  -- NULL for manual-only badges (awarded by admin).
  threshold      integer CHECK (threshold IS NULL OR threshold > 0),

  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read the badge catalog.
CREATE POLICY "badge_definitions_public_read"
  ON badge_definitions FOR SELECT
  USING (true);

-- ── youth_badges ──────────────────────────────────────────────

CREATE TABLE youth_badges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_slug  text        NOT NULL REFERENCES badge_definitions(slug),
  awarded_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, badge_slug)
);

ALTER TABLE youth_badges ENABLE ROW LEVEL SECURITY;

-- Badges are public information — visible to anyone reading a profile.
-- The application layer already gates display behind is_profile_public.
CREATE POLICY "youth_badges_public_read"
  ON youth_badges FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies: all writes via service-role only.

CREATE INDEX youth_badges_user_id_idx
  ON youth_badges (user_id, awarded_at DESC);

-- ── Initial badge catalog (V1) ────────────────────────────────
-- Keep the set small. Add more badges in a later migration
-- once usage patterns are understood.

INSERT INTO badge_definitions (slug, name, description, icon_emoji, criteria_type, threshold) VALUES
  ('first_published', 'First Published',   'Your first submission went live',              '🌟', 'submissions_published', 1),
  ('five_published',  'Prolific Creator',  '5 published submissions',                      '✍️', 'submissions_published', 5),
  ('three_streak',    'On a Roll',         '3 days in a row submitting work',              '🔥', 'streak_current',        3),
  ('seven_streak',    'Week Streak',       '7 days in a row submitting work',              '🏆', 'streak_current',        7),
  ('coin_collector',  'Coin Collector',    'Earned 100 or more Kana Coins',                '🪙', 'coins_balance',         100);
