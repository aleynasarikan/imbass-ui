-- ============================================================================
-- Sprint 2 — Agency CRM
-- Idempotent. Safe to run multiple times.
-- ============================================================================

BEGIN;

-- ── Enums for Roles & Statuses ───────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_relation_status') THEN
        CREATE TYPE agency_relation_status AS ENUM('INVITED', 'ACCEPTED', 'REJECTED', 'TERMINATED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_member_role') THEN
        CREATE TYPE agency_member_role AS ENUM('ADMIN', 'MANAGER', 'EDITOR');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');
    END IF;
END $$;

-- ── agency_creators: Relationship between Agency and Creator ─────────────────
CREATE TABLE IF NOT EXISTS agency_creators (
    agency_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          agency_relation_status NOT NULL DEFAULT 'INVITED',
    role_in_agency  TEXT, -- Optional specific role like "Top Creator", "Exclusive"
    invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at       TIMESTAMPTZ,
    PRIMARY KEY (agency_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_creators_agency  ON agency_creators(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_creators_creator ON agency_creators(creator_id);
CREATE INDEX IF NOT EXISTS idx_agency_creators_status  ON agency_creators(status);

-- ── agency_members: Multi-user Agency Management ──────────────────────────────
CREATE TABLE IF NOT EXISTS agency_members (
    agency_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            agency_member_role NOT NULL DEFAULT 'EDITOR',
    permissions     JSONB DEFAULT '{}',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agency_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user   ON agency_members(user_id);

-- ── agency_notes: Internal notes on creators ──────────────────────────────────
CREATE TABLE IF NOT EXISTS agency_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    body            TEXT NOT NULL,
    is_pinned       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_notes_agency_creator ON agency_notes(agency_id, creator_id);
CREATE TRIGGER trg_agency_notes_updated_at BEFORE UPDATE ON agency_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── tasks: Task/Todo management for campaigns & creators ──────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    status          task_status NOT NULL DEFAULT 'TODO',
    due_at          TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_agency    ON tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator   ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign  ON tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON tasks(assignee_id);
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
