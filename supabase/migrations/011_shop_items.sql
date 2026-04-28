-- ============================================================
-- Migration 011: Shop Items
-- Depends on: 001 (users), 008 (badge_definitions)
-- Defines purchasable items (V1: badge unlocks only).
-- All writes to shop_items go through service-role only.
-- Youth-facing reads are filtered to is_active = true by RLS.
-- ============================================================

-- ── New purchasable badge definitions ─────────────────────────
-- These are manual-only badges sold in the shop.
-- They are not awarded automatically by any criteria function.

INSERT INTO badge_definitions (slug, name, description, icon_emoji, criteria_type, threshold)
VALUES
  ('explorer',      'Explorer',       'Awarded to curious members who explore the shop.',  '🧭', 'manual', NULL),
  ('pioneer',       'Pioneer',        'An exclusive badge for early supporters.',           '🚀', 'manual', NULL),
  ('global_voice',  'Global Voice',   'Recognises a youth with a global perspective.',     '🌍', 'manual', NULL),
  ('kindness_star', 'Kindness Star',  'Celebrating a member who leads with kindness.',     '⭐', 'manual', NULL);

-- ── shop_items ────────────────────────────────────────────────

CREATE TABLE shop_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE
                            CHECK (slug ~ '^[a-z0-9_]+$'),
  name        text        NOT NULL,
  description text,
  price_coins integer     NOT NULL CHECK (price_coins > 0),

  -- V1 supports only 'badge'. item_ref is the badge_definitions.slug
  -- that will be granted on purchase.
  category    text        NOT NULL DEFAULT 'badge'
                            CHECK (category IN ('badge')),
  item_ref    text        NOT NULL REFERENCES badge_definitions(slug),

  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read active items only.
-- Service-role bypasses RLS for admin writes.
CREATE POLICY "shop_items_select_active"
  ON shop_items FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE INDEX shop_items_active_sort_idx
  ON shop_items (is_active, sort_order);

-- ── Seed V1 shop catalog ──────────────────────────────────────

INSERT INTO shop_items (slug, name, description, price_coins, item_ref, sort_order)
VALUES
  ('shop_explorer',      'Explorer Badge',       'Show the world you love discovering new things.',       50,  'explorer',      1),
  ('shop_pioneer',       'Pioneer Badge',        'An exclusive badge for early Flying Bus members.',     100,  'pioneer',       2),
  ('shop_global_voice',  'Global Voice Badge',   'A badge for youth with a truly global perspective.',   75,  'global_voice',  3),
  ('shop_kindness_star', 'Kindness Star Badge',  'Lead with kindness — wear it with pride.',             60,  'kindness_star', 4);
