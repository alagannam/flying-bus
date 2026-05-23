-- ============================================================
-- Migration 015: Audit Events (foundation)
-- Depends on: 001 (users)
-- Append-only event log. No client read or write policies — all
-- access is service-role only, from admin Server Components (reads)
-- and event-writer server actions (writes) that will be added in
-- later batches as existing actions are retrofitted.
-- ============================================================

CREATE TABLE audit_events (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     text        NOT NULL,
  actor_user_id  uuid        REFERENCES users(id) ON DELETE SET NULL,
  target_type    text,
  target_id      uuid,
  payload        jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- No SELECT, INSERT, UPDATE, or DELETE policies are defined.
-- With RLS enabled and no policies, anon and authenticated clients
-- see and write nothing. Service-role bypasses RLS and is the only
-- way to read or write this table.

-- Timeline scan (admin audit log page reads latest first).
CREATE INDEX audit_events_created_at_idx
  ON audit_events (created_at DESC);

-- "Events for this target" lookups (future per-row drill-downs).
CREATE INDEX audit_events_target_idx
  ON audit_events (target_type, target_id);
