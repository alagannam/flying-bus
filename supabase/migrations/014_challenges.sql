-- ============================================================
-- Migration 014: Challenges
-- Depends on: 001 (age_band enum)
-- Public read for active challenges. All writes are service-role
-- only (no client INSERT/UPDATE/DELETE policy).
-- ============================================================

CREATE TABLE challenges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  title       text        NOT NULL,
  description text,
  category    text,
  age_bands   age_band[],
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active challenges.
-- Inactive challenges are invisible — the caller cannot distinguish
-- a missing slug from an inactive one (both return no rows).
CREATE POLICY "challenges_select_active"
  ON challenges FOR SELECT
  USING (is_active = true);

-- Ordered listing of active challenges, fastest path.
CREATE INDEX challenges_active_sort_idx
  ON challenges (sort_order ASC)
  WHERE is_active = true;
