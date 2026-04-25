-- ============================================================
-- Migration 005: Kana Ledger
-- Depends on: 001 (users, youth_profiles)
-- append-only ledger + atomic award_coins function.
-- All writes go through service-role server actions.
-- award_coins is a plain function (no SECURITY DEFINER) because
-- it is only ever called from a service-role client that already
-- bypasses RLS.
-- ============================================================

CREATE TYPE kana_reason AS ENUM (
  'submission_approved',
  'challenge_completed',
  'weekly_mission',
  'admin_grant',
  'admin_deduct',
  'spend'
);

CREATE TABLE kana_ledger (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        integer NOT NULL,          -- positive = earn, negative = spend
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  reason        kana_reason NOT NULL,
  reference_id  uuid,                      -- submission id, challenge id, etc.
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kana_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own ledger entries (coin history screen)
CREATE POLICY "kana_ledger_select_own"
  ON kana_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX kana_ledger_user_id_idx
  ON kana_ledger (user_id, created_at DESC);

-- ── award_coins ───────────────────────────────────────────────
-- Atomically increments youth_profiles.coins_balance and inserts
-- a ledger row. Returns the new balance.
-- Must be called from a service-role client — not callable by anon.

CREATE OR REPLACE FUNCTION award_coins(
  p_user_id      uuid,
  p_amount       integer,
  p_reason       kana_reason,
  p_reference_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE youth_profiles
     SET coins_balance = coins_balance + p_amount
   WHERE user_id = p_user_id
  RETURNING coins_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'youth_profile not found for user %', p_user_id;
  END IF;

  INSERT INTO kana_ledger (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_reference_id);

  RETURN v_new_balance;
END;
$$;
