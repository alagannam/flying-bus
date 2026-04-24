-- ============================================================
-- Migration 003: Clubs and Memberships
-- Depends on: 001 (users), 002 (user_roles)
-- Also adds the FK from user_roles.scope_id → clubs.id
-- ============================================================

CREATE TABLE clubs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE
                     CHECK (slug ~ '^[a-z0-9-]{2,60}$'),
  name             text NOT NULL,
  description      text NOT NULL,
  mission          text NOT NULL,
  cover_image_url  text,
  age_bands        age_band[] NOT NULL DEFAULT ARRAY['8-10','11-13','14-18']::age_band[],
  sort_order       integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Active clubs are readable by everyone (public club pages are SSR)
CREATE POLICY "clubs_select_active"
  ON clubs FOR SELECT
  USING (is_active = true);

-- ── club_memberships ─────────────────────────────────────────

CREATE TABLE club_memberships (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  is_active  boolean NOT NULL DEFAULT true,

  UNIQUE (user_id, club_id)
);

ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY "club_memberships_select_own"
  ON club_memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Users can join clubs (insert their own membership)
CREATE POLICY "club_memberships_insert_own"
  ON club_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Wire user_roles.scope_id → clubs ─────────────────────────
-- Deferred FK: only enforced when scope_type = 'club'.
-- Application logic ensures scope_id is always set when scope_type = 'club'.

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_scope_clubs_fkey
  FOREIGN KEY (scope_id) REFERENCES clubs(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;
