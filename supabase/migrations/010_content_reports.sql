-- ============================================================
-- Migration 010: Content Reports
-- Depends on: 001 (users), 004 (submissions)
-- Append-only from the youth side — reports are immutable once
-- filed. Moderator reads and status updates go through the
-- service-role client only (no moderator RLS write policy needed).
-- target_type is constrained to 'submission' for V1.
-- ============================================================

CREATE TABLE content_reports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type       text        NOT NULL DEFAULT 'submission'
                                  CHECK (target_type IN ('submission')),
  target_id         uuid        NOT NULL,
  reason            text        NOT NULL
                                  CHECK (reason IN (
                                    'inappropriate',
                                    'offensive',
                                    'spam',
                                    'misleading',
                                    'other'
                                  )),
  detail            text        CHECK (char_length(detail) <= 500),
  status            text        NOT NULL DEFAULT 'open'
                                  CHECK (status IN (
                                    'open',
                                    'reviewed',
                                    'actioned',
                                    'dismissed'
                                  )),
  reviewed_by       uuid        REFERENCES users(id),
  reviewed_at       timestamptz,
  moderator_note    text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- One report per reporter per target. Prevents spam-filing.
  UNIQUE (reporter_user_id, target_type, target_id)
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Youth can file a report
CREATE POLICY "content_reports_insert_own"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- Reporter can read their own reports (used server-side to detect duplicates)
CREATE POLICY "content_reports_select_own"
  ON content_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- No youth UPDATE or DELETE policy.
-- All moderator reads and status updates use the service-role client.

CREATE INDEX content_reports_status_idx
  ON content_reports (status, created_at DESC);

CREATE INDEX content_reports_target_idx
  ON content_reports (target_type, target_id);
