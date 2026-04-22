-- ============================================================================
-- Sprint 5 — Milestones + settlement + revenue + agency ranking
-- Reuses the existing accounts / ledger_transactions / ledger_entries tables.
-- Idempotent.
-- ============================================================================

BEGIN;

-- ── Helper view: creator earnings (sum of CREDIT entries on USER_BALANCE) ───
-- One row per (creator_id, month). Used for the revenue heatmap.
CREATE OR REPLACE VIEW creator_monthly_earnings AS
SELECT
    a.owner_id                           AS creator_id,
    date_trunc('month', e.created_at)    AS month,
    SUM(e.amount_cents)::BIGINT          AS amount_cents,
    COUNT(*)::INTEGER                    AS entry_count
FROM   ledger_entries e
JOIN   accounts a ON a.id = e.account_id
WHERE  a.account_type = 'USER_BALANCE'
  AND  e.entry_type   = 'CREDIT'
GROUP BY a.owner_id, date_trunc('month', e.created_at);

-- ── Helper view: agency leaderboard metrics ────────────────────────────────
-- Row per agency: total paid out from their ESCROW, campaigns run, roster size.
CREATE OR REPLACE VIEW agency_metrics AS
SELECT
    u.id                                           AS agency_id,
    COALESCE(p.company_name, p.full_name, u.email) AS agency_name,
    COALESCE(
      (SELECT SUM(e.amount_cents)
         FROM ledger_entries e
         JOIN accounts a ON a.id = e.account_id
        WHERE a.owner_id = u.id
          AND a.account_type = 'ESCROW'
          AND e.entry_type   = 'DEBIT'),
      0
    )::BIGINT                                      AS total_paid_cents,
    (SELECT COUNT(*)::INTEGER FROM agency_creators ac
      WHERE ac.agency_id = u.id AND ac.status = 'ACCEPTED')   AS roster_size,
    (SELECT COUNT(*)::INTEGER FROM campaigns c
      WHERE c.creator_id = u.id)                              AS campaign_count,
    (SELECT COUNT(*)::INTEGER FROM campaigns c
      WHERE c.creator_id = u.id AND c.status = 'SETTLED')     AS settled_count,
    (SELECT COUNT(*)::INTEGER FROM applications app
       JOIN campaigns c ON c.id = app.campaign_id
      WHERE c.creator_id = u.id AND app.status = 'ACCEPTED')  AS accepted_apps
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.role = 'AGENCY';

-- ── Settlement helpers ───────────────────────────────────────────────────────
-- Get-or-create an account of a given type for a user.
CREATE OR REPLACE FUNCTION ensure_account(
    target_owner UUID,
    target_type  account_type,
    target_name  TEXT
) RETURNS UUID AS $$
DECLARE
    aid UUID;
BEGIN
    SELECT id INTO aid
      FROM accounts
     WHERE owner_id = target_owner AND account_type = target_type
     LIMIT 1;

    IF aid IS NULL THEN
        INSERT INTO accounts (owner_id, name, account_type, currency)
        VALUES (target_owner, target_name, target_type, 'USD')
        RETURNING id INTO aid;
    END IF;

    RETURN aid;
END;
$$ LANGUAGE plpgsql;

-- Release a milestone: create paired ledger entries, flip status. Transactional.
CREATE OR REPLACE FUNCTION release_milestone(milestone_uid UUID)
RETURNS VOID AS $$
DECLARE
    m          milestones%ROWTYPE;
    agency_id  UUID;
    creator_id UUID;
    esc_acc    UUID;
    bal_acc    UUID;
    txn        UUID;
BEGIN
    SELECT * INTO m FROM milestones WHERE id = milestone_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Milestone not found';
    END IF;
    IF m.status = 'RELEASED' THEN
        RAISE EXCEPTION 'Milestone already released';
    END IF;
    IF m.amount_cents <= 0 THEN
        -- Zero-amount milestones skip the ledger; just flip status.
        UPDATE milestones
           SET status = 'RELEASED', released_at = NOW(), approved_at = COALESCE(approved_at, NOW())
         WHERE id = milestone_uid;
        RETURN;
    END IF;

    -- Resolve participants
    SELECT c.creator_id INTO agency_id FROM campaigns c WHERE c.id = m.campaign_id;
    SELECT app.influencer_id INTO creator_id FROM applications app WHERE app.id = m.application_id;
    IF agency_id IS NULL OR creator_id IS NULL THEN
        RAISE EXCEPTION 'Milestone is missing an application/campaign link';
    END IF;

    esc_acc := ensure_account(agency_id,  'ESCROW'::account_type,       'Agency escrow');
    bal_acc := ensure_account(creator_id, 'USER_BALANCE'::account_type, 'Creator balance');

    -- One transaction, two entries
    INSERT INTO ledger_transactions (reference_id, reference_type, description)
    VALUES (m.id, 'milestone', 'Release milestone ' || COALESCE(m.title,'') )
    RETURNING id INTO txn;

    INSERT INTO ledger_entries (transaction_id, account_id, amount_cents, entry_type)
    VALUES (txn, esc_acc, m.amount_cents, 'DEBIT');

    INSERT INTO ledger_entries (transaction_id, account_id, amount_cents, entry_type)
    VALUES (txn, bal_acc, m.amount_cents, 'CREDIT');

    UPDATE milestones
       SET status      = 'RELEASED',
           released_at = NOW(),
           approved_at = COALESCE(approved_at, NOW())
     WHERE id = milestone_uid;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- Seed: give Ayşe a sample milestone & release it so the heatmap shows data.
-- Only runs if no milestones exist yet (idempotent-safe).
-- ============================================================================
DO $$
DECLARE
    have INTEGER;
    app_id UUID;
    agency_uid UUID;
    campaign_uid UUID;
    ms_id UUID;
BEGIN
    SELECT COUNT(*) INTO have FROM milestones;
    IF have > 0 THEN RETURN; END IF;

    -- Find Ayşe's first ACCEPTED application
    SELECT app.id, c.id, c.creator_id
      INTO app_id, campaign_uid, agency_uid
      FROM applications app
      JOIN users u ON u.id = app.influencer_id
      JOIN campaigns c ON c.id = app.campaign_id
     WHERE u.email = 'ayse@imbass.com'
       AND app.status = 'ACCEPTED'
     ORDER BY app.created_at ASC
     LIMIT 1;

    IF app_id IS NULL THEN RETURN; END IF;

    INSERT INTO milestones (campaign_id, application_id, title, amount_cents, status)
    VALUES (campaign_uid, app_id, 'Deliverable 1: Reel #1', 250000, 'PENDING')
    RETURNING id INTO ms_id;

    PERFORM release_milestone(ms_id);

    -- One more, unreleased, so agency UI has something to approve
    INSERT INTO milestones (campaign_id, application_id, title, amount_cents, status)
    VALUES (campaign_uid, app_id, 'Deliverable 2: Story bundle', 150000, 'SUBMITTED');
END $$;
