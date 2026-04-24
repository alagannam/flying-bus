-- ============================================================
-- Migration 002: Roles, Guardian Invites, Platform Config
-- Depends on: 001 (users)
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'contributor',
  'author',
  'junior_editor',
  'editor',
  'channel_host',
  'club_captain',
  'moderator',
  'admin',
  'sponsor'
);

CREATE TYPE role_scope_type AS ENUM ('global', 'club');

-- ── user_roles ───────────────────────────────────────────────

CREATE TABLE user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  scope_type  role_scope_type NOT NULL DEFAULT 'global',
  scope_id    uuid,    -- FK to clubs.id added in migration 003 when clubs exists
  granted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz,

  -- A user can hold the same role in multiple clubs, but not the same global role twice
  UNIQUE (user_id, role, scope_type, scope_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own active roles (needed for nav and permission checks)
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id AND revoked_at IS NULL);

-- ── pending_guardian_invites ─────────────────────────────────
-- Temporary table. Row is consumed when the parent creates their account.
-- token_hash = SHA-256(raw_token). Raw token is only in the email link.

CREATE TABLE pending_guardian_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email    text NOT NULL,
  child_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      text NOT NULL UNIQUE,
  expires_at      timestamptz NOT NULL,
  consumed_at     timestamptz,    -- set when parent creates account; row kept for audit
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pending_guardian_invites ENABLE ROW LEVEL SECURITY;
-- No client-side access. All reads/writes via service role in Server Actions.

-- ── platform_config ──────────────────────────────────────────
-- Key-value store for platform-level settings.
-- Seeded with defaults. Admin UI built in Phase 8.
-- Admins update directly via Supabase dashboard in V1 if needed.

CREATE TABLE platform_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read config (coin amounts shown in UI)
CREATE POLICY "platform_config_select_authenticated"
  ON platform_config FOR SELECT
  TO authenticated
  USING (true);

-- No client-side writes
