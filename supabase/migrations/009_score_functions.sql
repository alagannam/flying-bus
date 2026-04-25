-- ============================================================
-- Migration 009: Score Functions
-- Depends on: 001 (youth_profiles)
-- Plain functions — no SECURITY DEFINER — because they are only
-- ever called from service-role server actions that already
-- bypass RLS. This is the same pattern as award_coins in 005.
-- ============================================================

-- ── increment_creator_score ───────────────────────────────────
-- Atomically increments creator_score by p_points and
-- recalculates creator_level in a single UPDATE.
-- Returns the new creator_score.
--
-- Level thresholds:
--   Level 1:  0 – 49
--   Level 2:  50 – 149
--   Level 3:  150 – 299
--   Level 4:  300 – 499
--   Level 5:  500+

CREATE OR REPLACE FUNCTION increment_creator_score(
  p_user_id uuid,
  p_points  integer
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_score integer;
BEGIN
  UPDATE youth_profiles
     SET creator_score = creator_score + p_points,
         creator_level = CASE
           WHEN creator_score + p_points >= 500 THEN 5
           WHEN creator_score + p_points >= 300 THEN 4
           WHEN creator_score + p_points >= 150 THEN 3
           WHEN creator_score + p_points >= 50  THEN 2
           ELSE 1
         END
   WHERE user_id = p_user_id
  RETURNING creator_score INTO v_new_score;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'youth_profile not found for user %', p_user_id;
  END IF;

  RETURN v_new_score;
END;
$$;

-- ── bump_streak ───────────────────────────────────────────────
-- Idempotent daily streak tracker. Call on any meaningful
-- creative action (currently: createAndSubmit only).
-- Uses UTC date — timezone edge cases are a known V1 limitation.
--
-- Logic:
--   same day as last_login_date → no-op, return current streak
--   consecutive day            → streak_current += 1
--   gap > 1 day / first ever  → streak_current = 1
--
-- Also increments participation_score by 1 per unique active day.
-- Returns the new streak_current.

CREATE OR REPLACE FUNCTION bump_streak(
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_today      date    := CURRENT_DATE;
  v_last_date  date;
  v_cur_streak integer;
  v_new_streak integer;
BEGIN
  SELECT last_login_date, streak_current
    INTO v_last_date, v_cur_streak
    FROM youth_profiles
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'youth_profile not found for user %', p_user_id;
  END IF;

  -- Already counted today — return without writing
  IF v_last_date = v_today THEN
    RETURN v_cur_streak;
  END IF;

  -- Consecutive day → extend streak; gap → reset to 1
  IF v_last_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := v_cur_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE youth_profiles
     SET streak_current     = v_new_streak,
         streak_longest     = GREATEST(streak_longest, v_new_streak),
         last_login_date    = v_today,
         participation_score = participation_score + 1
   WHERE user_id = p_user_id;

  RETURN v_new_streak;
END;
$$;
