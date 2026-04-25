-- ============================================================
-- Migration 004: Submissions
-- Depends on: 001 (users), 003 (clubs, age_band enum)
-- All writes are service-role only. RLS policies are read-side.
-- ============================================================

CREATE TYPE submission_status AS ENUM (
  'draft',
  'pending_parent_approval',
  'pending_review',
  'published',
  'rejected'
);

CREATE TABLE submissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youth_user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id              uuid REFERENCES clubs(id) ON DELETE SET NULL,
  title                text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  body                 text NOT NULL CHECK (char_length(body) >= 20),
  status               submission_status NOT NULL DEFAULT 'draft',
  age_band             age_band NOT NULL,

  -- Set when youth clicks "Submit for review"
  submitted_at         timestamptz,

  -- Parent gate (8-10 age band with publish_requires_approval)
  parent_reviewed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  parent_reviewed_at   timestamptz,
  parent_review_note   text,

  -- Editor/moderator/admin review
  reviewed_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at          timestamptz,
  review_note          text,

  -- Publish
  published_at         timestamptz,
  coins_awarded        integer NOT NULL DEFAULT 0,

  created_at           timestamptz NOT NULL DEFAULT now()
  -- No updated_at: all state transitions are captured by the specific
  -- timestamp columns above. Add with a trigger in Phase 3 when draft
  -- editing is built.
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Youth can read all their own submissions regardless of status
CREATE POLICY "submissions_select_own"
  ON submissions FOR SELECT
  USING (auth.uid() = youth_user_id);

-- Anyone (including anon) can read published submissions
CREATE POLICY "submissions_select_published"
  ON submissions FOR SELECT
  USING (status = 'published');

-- Editors, moderators, and admins can read all non-draft submissions
CREATE POLICY "submissions_select_staff"
  ON submissions FOR SELECT
  USING (
    status <> 'draft'
    AND EXISTS (
      SELECT 1 FROM users
       WHERE id = auth.uid()
         AND account_type IN ('editor', 'moderator', 'admin')
    )
  );

-- Parents can read pending_parent_approval submissions for their linked children
CREATE POLICY "submissions_select_parent"
  ON submissions FOR SELECT
  USING (
    status = 'pending_parent_approval'
    AND EXISTS (
      SELECT 1 FROM guardian_links
       WHERE parent_user_id = auth.uid()
         AND child_user_id  = submissions.youth_user_id
         AND status         = 'active'
    )
  );

-- ── Indexes ───────────────────────────────────────────────────

-- Studio page and my-submissions list: by owner
CREATE INDEX submissions_youth_user_id_idx
  ON submissions (youth_user_id, created_at DESC);

-- Review queue list: pending oldest-first
CREATE INDEX submissions_pending_review_idx
  ON submissions (submitted_at ASC)
  WHERE status = 'pending_review';

-- Parent approvals: pending_parent_approval by owner (joined to guardian_links)
CREATE INDEX submissions_pending_parent_idx
  ON submissions (youth_user_id, submitted_at ASC)
  WHERE status = 'pending_parent_approval';

-- Club page: published submissions by club, newest first
CREATE INDEX submissions_club_published_idx
  ON submissions (club_id, published_at DESC)
  WHERE status = 'published';
