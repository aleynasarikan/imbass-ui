-- ============================================================================
-- Sprint 3 — Campaign marketplace + applications + milestones + notifications
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- ── Enum types ───────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM('PENDING','ACCEPTED','REJECTED','WITHDRAWN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') THEN
        CREATE TYPE milestone_status AS ENUM('PENDING','IN_PROGRESS','SUBMITTED','APPROVED','RELEASED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM(
            'ROSTER_INVITE','ROSTER_ACCEPTED','ROSTER_REJECTED',
            'APPLICATION_RECEIVED','APPLICATION_ACCEPTED','APPLICATION_REJECTED',
            'MILESTONE_SUBMITTED','MILESTONE_RELEASED',
            'CAMPAIGN_PUBLISHED'
        );
    END IF;
END $$;

-- ── campaigns: marketplace metadata ──────────────────────────────────────────
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_public    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief        TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deadline_at  TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platforms    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS niche        TEXT;
CREATE INDEX IF NOT EXISTS idx_campaigns_public      ON campaigns(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_niche       ON campaigns(niche);
CREATE INDEX IF NOT EXISTS idx_campaigns_deadline    ON campaigns(deadline_at);

-- ── applications: migrate existing TEXT status + add pitch ───────────────────
-- (applications table already exists from Sprint 0; it uses TEXT for status.
--  We keep TEXT for backwards compat but add a CHECK constraint + pitch column.)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS pitch        TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reviewer_id  UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_status_valid') THEN
        ALTER TABLE applications ADD CONSTRAINT applications_status_valid
            CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_unique_pair') THEN
        ALTER TABLE applications ADD CONSTRAINT applications_unique_pair
            UNIQUE (campaign_id, influencer_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_campaign ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_influencer ON applications(influencer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON applications(status);

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── milestones: deliverable + payment tracking ──────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    amount_cents    BIGINT NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
    position        SMALLINT NOT NULL DEFAULT 0,
    status          milestone_status NOT NULL DEFAULT 'PENDING',
    due_at          TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ,
    approved_at     TIMESTAMPTZ,
    released_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_milestones_campaign    ON milestones(campaign_id);
CREATE INDEX IF NOT EXISTS idx_milestones_application ON milestones(application_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status      ON milestones(status);
DROP TRIGGER IF EXISTS trg_milestones_updated_at ON milestones;
CREATE TRIGGER trg_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── notifications: in-app notification feed ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         notification_type NOT NULL,
    title        TEXT NOT NULL,
    body         TEXT,
    link         TEXT,                        -- in-app deep link, e.g. '/u/ayse-yilmaz'
    metadata     JSONB NOT NULL DEFAULT '{}',
    is_read      BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

COMMIT;

-- ============================================================================
-- Seed refresh: make the 2 ACTIVE seed campaigns public + add brief/platforms/deadline
-- ============================================================================
UPDATE campaigns
   SET is_public   = true,
       brief       = COALESCE(brief, 'Looking for authentic creators to feature our product in an organic content series.'),
       platforms   = COALESCE(NULLIF(platforms, ARRAY[]::TEXT[]), ARRAY['INSTAGRAM','YOUTUBE']),
       niche       = COALESCE(niche, 'Fashion'),
       deadline_at = COALESCE(deadline_at, NOW() + INTERVAL '21 days')
 WHERE status = 'ACTIVE';
