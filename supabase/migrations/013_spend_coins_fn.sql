-- ============================================================
-- Migration 013: spend_coins Function
-- Depends on: 001 (users, youth_profiles), 005 (kana_ledger, kana_reason)
-- Adds 'shop_purchase' to kana_reason and creates the atomic
-- spend_coins function that mirrors award_coins from 005.
-- ============================================================

-- ── Extend kana_reason enum ───────────────────────────────────
-- ADD VALUE IF NOT EXISTS is safe to re-run.

ALTER TYPE kana_reason ADD VALUE IF NOT EXISTS 'shop_purchase';

-- ── spend_coins ───────────────────────────────────────────────
-- Atomically deducts coins from youth_profiles and writes to
-- kana_ledger. Raises exception 'P0001' with message
-- 'insufficient_balance' if the youth does not have enough coins.
--
-- Not SECURITY DEFINER: must be called from a service-role client
-- that already bypasses RLS — same pattern as award_coins (005).
--
-- The WHERE coins_balance >= p_amount guard in the UPDATE is the
-- atomic race-condition fence. A separate SELECT + UPDATE would
-- allow two concurrent calls to both pass the check.
--
-- The kana_ledger CHECK (balance_after >= 0) provides a DB-level
-- safety net should the function ever be called incorrectly.

CREATE OR REPLACE FUNCTION spend_coins(
  p_user_id      uuid,
  p_amount       integer,
  p_reason       kana_reason,
  p_reference_id uuid DEFAULT NULL
)
RETURNS integer   -- returns new coins_balance
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE youth_profiles
     SET coins_balance = coins_balance - p_amount
   WHERE user_id        = p_user_id
     AND coins_balance >= p_amount
  RETURNING coins_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_balance'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO kana_ledger (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_amount, v_new_balance, p_reason, p_reference_id);

  RETURN v_new_balance;
END;
$$;
