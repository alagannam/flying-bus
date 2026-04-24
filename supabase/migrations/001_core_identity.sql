-- ============================================================
-- Migration 001: Core Identity
-- users, youth_profiles, parent_profiles, guardian_links
-- RLS enabled on all tables with deny-all default.
-- Permissive policies added below — always explicit.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE account_type AS ENUM (
  'youth', 'parent', 'editor', 'moderator', 'admin', 'sponsor'
);

CREATE TYPE account_status AS ENUM (
  'active', 'suspended', 'frozen', 'deleted', 'pending_exit'
);

CREATE TYPE age_band AS ENUM ('8-10', '11-13', '14-18');

-- ── users ────────────────────────────────────────────────────

CREATE TABLE users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text UNIQUE NOT NULL,
  account_type     account_type NOT NULL,
  account_status   account_status NOT NULL DEFAULT 'active',
  email_verified   boolean NOT NULL DEFAULT false,
  suspended_until  timestamptz,          -- set for time-limited suspensions
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_login_at    timestamptz,
  deleted_at       timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row only
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- No client-side inserts or updates — all writes via service role in Server Actions

-- ── youth_profiles ───────────────────────────────────────────

CREATE TABLE youth_profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name             text NOT NULL,
  username                 text NOT NULL UNIQUE
                             CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  avatar_url               text,
  bio                      text CHECK (char_length(bio) <= 200),

  -- Age band — computed from DOB at signup; DOB is never stored
  age_band                 age_band NOT NULL,
  age_band_changes_on      date,          -- date of next band transition (null for 14-18)
  platform_exit_date       date NOT NULL, -- date user turns 19; triggers exit flow

  -- Guardian state
  guardian_linked          boolean NOT NULL DEFAULT false,

  -- Progression
  creator_level            integer NOT NULL DEFAULT 1 CHECK (creator_level >= 1),
  participation_score      integer NOT NULL DEFAULT 0 CHECK (participation_score >= 0),
  creator_score            integer NOT NULL DEFAULT 0 CHECK (creator_score >= 0),
  streak_current           integer NOT NULL DEFAULT 0 CHECK (streak_current >= 0),
  streak_longest           integer NOT NULL DEFAULT 0 CHECK (streak_longest >= 0),
  last_login_date          date,          -- used for streak tracking; date only, not timestamp

  -- Kana Coins — materialized balance; source of truth is kana_ledger
  coins_balance            integer NOT NULL DEFAULT 0 CHECK (coins_balance >= 0),

  -- Thirdweb — wallet created silently at signup; address stored for V2 on-chain use
  thirdweb_wallet_address  text,

  is_profile_public        boolean NOT NULL DEFAULT true,
  joined_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE youth_profiles ENABLE ROW LEVEL SECURITY;

-- Owner: full row
CREATE POLICY "youth_profiles_select_own"
  ON youth_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Public: only is_profile_public = true rows
-- Columns returned to non-owners are controlled at the application layer
CREATE POLICY "youth_profiles_select_public"
  ON youth_profiles FOR SELECT
  USING (is_profile_public = true);

-- ── parent_profiles ──────────────────────────────────────────

CREATE TABLE parent_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name          text NOT NULL,
  phone                 text,   -- encrypted at application layer if stored
  notify_on_submission  boolean NOT NULL DEFAULT true,
  notify_on_approval    boolean NOT NULL DEFAULT true,
  notify_on_moderation  boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_profiles_select_own"
  ON parent_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- ── guardian_links ───────────────────────────────────────────

CREATE TABLE guardian_links (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship                text NOT NULL DEFAULT 'parent',
  status                      text NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'active', 'revoked')),
  -- Permission flags — defaults set by age_band at link creation; parent can adjust
  spending_requires_approval  boolean NOT NULL DEFAULT false,
  publish_requires_approval   boolean NOT NULL DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  approved_at                 timestamptz,

  UNIQUE (parent_user_id, child_user_id)
);

ALTER TABLE guardian_links ENABLE ROW LEVEL SECURITY;

-- Parent sees their own links
CREATE POLICY "guardian_links_select_parent"
  ON guardian_links FOR SELECT
  USING (auth.uid() = parent_user_id);

-- Child can see links to themselves (to know they are linked)
CREATE POLICY "guardian_links_select_child"
  ON guardian_links FOR SELECT
  USING (auth.uid() = child_user_id);

-- Parent can update permission flags on their own links
CREATE POLICY "guardian_links_update_parent"
  ON guardian_links FOR UPDATE
  USING (auth.uid() = parent_user_id)
  WITH CHECK (auth.uid() = parent_user_id);
