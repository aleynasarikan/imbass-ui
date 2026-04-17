-- ============================================================================
-- Sprint 1 — Marketplace foundation
-- Idempotent. Safe to run multiple times. Run against an existing DB with:
--   docker exec -i imbass_postgres psql -U imbass -d imbass < server/migrations/001_sprint1_marketplace.sql
-- For a brand-new DB, `node server/setup-db.js` already includes these.
-- ============================================================================

BEGIN;

-- ── profiles: add marketplace columns ────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug         TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS niche        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score  SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp           INTEGER  NOT NULL DEFAULT 0;

-- Check constraints (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_trust_score_range') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_trust_score_range CHECK (trust_score BETWEEN 0 AND 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_xp_nonneg') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_xp_nonneg CHECK (xp >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_slug_unique') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Backfill slugs for any profile without one, deriving from full_name
-- Example: "Ayşe Yılmaz" → "ayse-yilmaz"; collisions get a -2/-3 suffix
WITH ranked AS (
    SELECT
        id,
        lower(regexp_replace(
            translate(full_name, 'ÇĞİÖŞÜçğıöşü', 'CGIOSUcgiosu'),
            '[^a-zA-Z0-9]+', '-', 'g'
        )) AS base
    FROM profiles
    WHERE slug IS NULL OR slug = ''
),
numbered AS (
    SELECT id, base,
           ROW_NUMBER() OVER (PARTITION BY base ORDER BY id) AS rn
    FROM ranked
)
UPDATE profiles p
SET    slug = CASE WHEN n.rn = 1 THEN n.base ELSE n.base || '-' || n.rn END
FROM   numbered n
WHERE  p.id = n.id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_slug      ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_niche     ON profiles(niche);
CREATE INDEX IF NOT EXISTS idx_profiles_available ON profiles(is_available) WHERE is_available = true;

-- ── follows: user-to-user follow graph ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
    follower_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_user_id),
    CHECK (follower_id <> following_user_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_user_id);

COMMIT;

-- ============================================================================
-- Seed / refresh creator-ish metadata on existing demo users (safe re-run)
-- Only updates rows that still have defaults, so manual edits survive.
-- ============================================================================

-- Demo slugs + marketplace fields. Idempotent (WHERE slug IS NULL safety kept by CTE above).
UPDATE profiles SET niche = 'Fashion',   trust_score = 88, xp = 4200, is_verified = true
    WHERE full_name ILIKE 'Ayşe%' AND niche IS NULL;
UPDATE profiles SET niche = 'Tech',      trust_score = 91, xp = 5800, is_verified = true
    WHERE full_name ILIKE 'Mehmet%' AND niche IS NULL;
UPDATE profiles SET niche = 'Marketing', trust_score = 79, xp = 2100
    WHERE full_name ILIKE 'Digital Agency%' AND niche IS NULL;
UPDATE profiles SET niche = 'Music',     trust_score = 83, xp = 3200
    WHERE full_name ILIKE 'Ahmet%' AND niche IS NULL;
