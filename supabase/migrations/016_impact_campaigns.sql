-- ============================================================
-- Migration 016: Impact Campaigns
-- Depends on: none (no FKs to other domain tables in this batch)
-- Public read for active campaigns. All writes are service-role
-- only — no admin UI or youth voting flow yet, so no client
-- INSERT/UPDATE/DELETE policies exist either.
-- ============================================================

CREATE TABLE impact_campaigns (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  description   text,
  goal_summary  text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean     NOT NULL DEFAULT true,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE impact_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active campaigns.
-- Inactive campaigns are invisible — same shape as the challenges
-- table's RLS, so a missing slug and an inactive slug are
-- indistinguishable from outside.
CREATE POLICY "impact_campaigns_select_active"
  ON impact_campaigns FOR SELECT
  USING (is_active = true);

-- Ordered listing of active campaigns, fastest path.
CREATE INDEX impact_campaigns_active_sort_idx
  ON impact_campaigns (sort_order ASC)
  WHERE is_active = true;
