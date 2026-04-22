-- ============================================================================
-- Sprint 4 — Creator level system: badges, indexes, XP/trust recompute fn
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- ── Badges (rozet) ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_badges (
    creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code        TEXT NOT NULL,             -- e.g. 'fast-deliverer', 'trusted-veteran'
    label       TEXT,
    description TEXT,
    awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (creator_id, code)
);
CREATE INDEX IF NOT EXISTS idx_creator_badges_creator ON creator_badges(creator_id);

-- ── Aggregate helper indexes ────────────────────────────────────────────────
-- Plain btree on created_at is enough for daily bucketing via date_trunc()
CREATE INDEX IF NOT EXISTS idx_applications_created_at      ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_negotiation_events_created_at ON negotiation_events(created_at);

-- ── XP + Trust recompute for a single creator ──────────────────────────────
-- Formula:
--   XP   = accepted_apps * 100 + completed_campaigns * 500 + rejected_apps * 10 + pending_apps * 5
--   Trust = clamp(
--             50 + (accepted * 5) - (rejected * 2)
--                + (completed * 3) + (badge_count * 4),
--             0, 100)
CREATE OR REPLACE FUNCTION recompute_creator_level(target_id UUID)
RETURNS VOID AS $$
DECLARE
    accepted_cnt  INTEGER;
    rejected_cnt  INTEGER;
    pending_cnt   INTEGER;
    completed_cnt INTEGER;
    badge_cnt     INTEGER;
    new_xp        INTEGER;
    new_trust     INTEGER;
BEGIN
    SELECT
        COALESCE(SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'PENDING'  THEN 1 ELSE 0 END), 0)
      INTO accepted_cnt, rejected_cnt, pending_cnt
      FROM applications
     WHERE influencer_id = target_id;

    SELECT COUNT(DISTINCT a.campaign_id)
      INTO completed_cnt
      FROM applications a
      JOIN campaigns    c ON c.id = a.campaign_id
     WHERE a.influencer_id = target_id
       AND a.status = 'ACCEPTED'
       AND c.status = 'SETTLED';

    SELECT COUNT(*) INTO badge_cnt FROM creator_badges WHERE creator_id = target_id;

    new_xp := accepted_cnt * 100 + completed_cnt * 500 + rejected_cnt * 10 + pending_cnt * 5;
    new_trust := GREATEST(0, LEAST(100,
        50 + (accepted_cnt * 5) - (rejected_cnt * 2) + (completed_cnt * 3) + (badge_cnt * 4)
    ));

    UPDATE profiles
       SET xp          = new_xp,
           trust_score = new_trust
     WHERE user_id = target_id;
END;
$$ LANGUAGE plpgsql;

-- ── Convenience: recompute ALL INFLUENCER profiles in one call ─────────────
CREATE OR REPLACE FUNCTION recompute_all_creators()
RETURNS INTEGER AS $$
DECLARE
    r RECORD;
    n INTEGER := 0;
BEGIN
    FOR r IN SELECT id FROM users WHERE role = 'INFLUENCER' LOOP
        PERFORM recompute_creator_level(r.id);
        n := n + 1;
    END LOOP;
    RETURN n;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Kick off an initial recompute pass so seeded creators get scored
SELECT recompute_all_creators();
