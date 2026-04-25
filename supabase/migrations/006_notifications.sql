-- ============================================================
-- Migration 006: Notifications
-- Depends on: 001 (users)
-- All inserts are service-role only.
-- Users may update their own read_at (mark as read) directly.
-- ============================================================

CREATE TYPE notification_type AS ENUM (
  'submission_published',
  'submission_rejected',
  'parent_approval_needed',
  'parent_approved',
  'parent_rejected',
  'coins_earned',
  'general'
);

CREATE TABLE notifications (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         text    NOT NULL,
  body          text,
  read_at       timestamptz,
  reference_id  uuid,                      -- submission id, etc.
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Mark-as-read is the only client-side write allowed.
-- WITH CHECK ensures users can only touch their own rows.
CREATE POLICY "notifications_update_own_read_at"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Partial index on unread rows — the most common query pattern
CREATE INDEX notifications_user_id_unread_idx
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;
