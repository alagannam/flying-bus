-- ============================================================
-- Migration 017: Link submissions to challenges
-- Depends on: 004 (submissions), 014 (challenges)
-- Adds optional challenge_id FK so a submission can be tagged
-- to the challenge it was created in response to.
-- Nullable — existing submissions and non-challenge submissions
-- are unaffected.
-- ============================================================
ALTER TABLE submissions
  ADD COLUMN challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL;

-- Index for challenge result pages and leaderboards
CREATE INDEX submissions_challenge_published_idx
  ON submissions (challenge_id, published_at DESC)
  WHERE status = 'published' AND challenge_id IS NOT NULL;
