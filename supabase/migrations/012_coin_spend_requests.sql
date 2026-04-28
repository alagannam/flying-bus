-- ============================================================
-- Migration 012: Coin Spend Requests
-- Depends on: 001 (users), 002 (guardian_links), 011 (shop_items)
-- Tracks pending parent-approval spend requests.
-- Created when a youth attempts a shop purchase and their
-- guardian_link.spending_requires_approval = true.
-- Coins are NOT deducted at request creation time. spend_coins
-- is called only when a parent approves the request.
-- ============================================================

CREATE TABLE coin_spend_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  youth_user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_user_id   uuid        NOT NULL REFERENCES users(id),
  guardian_link_id uuid        NOT NULL REFERENCES guardian_links(id),
  shop_item_id     uuid        NOT NULL REFERENCES shop_items(id),
  coins_amount     integer     NOT NULL CHECK (coins_amount > 0),

  -- pending   → awaiting parent action
  -- approved  → parent approved; spend_coins was called; badge granted
  -- rejected  → parent declined
  -- cancelled → youth withdrew the request before parent acted
  status           text        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','approved','rejected','cancelled')),

  review_note      text,                                    -- parent's optional message
  created_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz
);

-- ── Indexes ───────────────────────────────────────────────────

-- Parent approval queue: filter by parent + status, ordered by oldest first.
CREATE INDEX coin_spend_requests_parent_status_idx
  ON coin_spend_requests (parent_user_id, status, created_at ASC);

-- Youth history: all requests for a given youth.
CREATE INDEX coin_spend_requests_youth_idx
  ON coin_spend_requests (youth_user_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE coin_spend_requests ENABLE ROW LEVEL SECURITY;

-- Youth: read their own requests (to show pending/approved/rejected in coins page).
CREATE POLICY "csr_select_own_youth"
  ON coin_spend_requests FOR SELECT
  TO authenticated
  USING (youth_user_id = auth.uid());

-- Parent: read requests where they are the approving parent.
CREATE POLICY "csr_select_own_parent"
  ON coin_spend_requests FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: all writes via service-role server actions only.
