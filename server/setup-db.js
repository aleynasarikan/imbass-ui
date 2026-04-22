/**
 * IMBASS Database Setup Script
 * Creates all tables, types, triggers, and seeds initial data into Docker PostgreSQL.
 * Run: node server/setup-db.js
 */
// Prefer server/.env; fall back to repo root .env for backwards compat
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setup() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to PostgreSQL.');
        console.log('🏗️  Creating schema...\n');

        await client.query('BEGIN');

        // ── Extensions ──
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
        console.log('✅ pgcrypto extension');

        // ── Enum Types (drop if exist for re-run safety) ──
        const enums = [
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN CREATE TYPE user_role AS ENUM('INFLUENCER','AGENCY','PRODUCER'); END IF; END $$;`,
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='campaign_status') THEN CREATE TYPE campaign_status AS ENUM('DRAFT','ACTIVE','SETTLED','CANCELLED'); END IF; END $$;`,
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='negotiation_status') THEN CREATE TYPE negotiation_status AS ENUM('PENDING','ACCEPTED','REJECTED','COUNTERED'); END IF; END $$;`,
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='negotiation_event_type') THEN CREATE TYPE negotiation_event_type AS ENUM('OFFER_MADE','OFFER_REJECTED','OFFER_ACCEPTED','COUNTER_OFFER','COMMENT_ADDED'); END IF; END $$;`,
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='entry_type') THEN CREATE TYPE entry_type AS ENUM('DEBIT','CREDIT'); END IF; END $$;`,
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='account_type') THEN CREATE TYPE account_type AS ENUM('ESCROW','REVENUE','PAYABLE','RECEIVABLE','USER_BALANCE'); END IF; END $$;`,
        ];
        for (const sql of enums) await client.query(sql);
        console.log('✅ Enum types');

        // ── Trigger Functions ──
        await client.query(`
            CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
            BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
            $$ LANGUAGE plpgsql;
        `);
        await client.query(`
            CREATE OR REPLACE FUNCTION prevent_modification() RETURNS TRIGGER AS $$
            BEGIN RAISE EXCEPTION 'Updates and deletes are prohibited on immutable transactional records.'; END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Trigger functions');

        // ── Tables ──
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role user_role NOT NULL,
                is_onboarding BOOLEAN NOT NULL DEFAULT false,
                refresh_token TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                full_name TEXT NOT NULL,
                bio TEXT,
                location TEXT,
                contact_email TEXT,
                avatar_url TEXT,
                company_name TEXT,
                logo_url TEXT,
                slug         TEXT UNIQUE,
                niche        TEXT,
                is_available BOOLEAN NOT NULL DEFAULT true,
                is_verified  BOOLEAN NOT NULL DEFAULT false,
                trust_score  SMALLINT NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
                xp           INTEGER  NOT NULL DEFAULT 0 CHECK (xp >= 0),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS follows (
                follower_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (follower_id, following_user_id),
                CHECK (follower_id <> following_user_id)
            );
        `);

        // ── Sprint 2: agency CRM ─────────────────────────────────────────
        await client.query(`
            DO $$ BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='agency_relation_status') THEN
                CREATE TYPE agency_relation_status AS ENUM('INVITED','ACCEPTED','REJECTED','TERMINATED');
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='agency_member_role') THEN
                CREATE TYPE agency_member_role AS ENUM('ADMIN','MANAGER','EDITOR');
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='task_status') THEN
                CREATE TYPE task_status AS ENUM('TODO','IN_PROGRESS','REVIEW','DONE','CANCELLED');
              END IF;
            END $$;
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS agency_creators (
                agency_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status          agency_relation_status NOT NULL DEFAULT 'INVITED',
                role_in_agency  TEXT,
                invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                joined_at       TIMESTAMPTZ,
                PRIMARY KEY (agency_id, creator_id)
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS agency_members (
                agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role      agency_member_role NOT NULL DEFAULT 'EDITOR',
                permissions JSONB DEFAULT '{}',
                joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (agency_id, user_id)
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS agency_notes (
                id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agency_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
                body       TEXT NOT NULL,
                is_pinned  BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        // `tasks` references `campaigns` — created later after analytics_data
        await client.query(`
            CREATE TABLE IF NOT EXISTS social_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                platform TEXT NOT NULL,
                username TEXT NOT NULL,
                follower_count BIGINT DEFAULT 0 CHECK(follower_count >= 0),
                profile_url TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ social_accounts table');        await client.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                title TEXT NOT NULL,
                description TEXT,
                budget_cents BIGINT NOT NULL DEFAULT 0 CHECK(budget_cents >= 0),
                currency CHAR(3) NOT NULL DEFAULT 'USD',
                status campaign_status NOT NULL DEFAULT 'DRAFT',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS negotiations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
                creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                agency_id UUID REFERENCES users(id) ON DELETE RESTRICT,
                current_offer_cents BIGINT CHECK(current_offer_cents >= 0),
                status negotiation_status NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT unique_negotiation UNIQUE(campaign_id, creator_id)
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS negotiation_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
                actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                event_type negotiation_event_type NOT NULL,
                offer_amount_cents BIGINT CHECK(offer_amount_cents >= 0),
                metadata_comment TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID REFERENCES users(id) ON DELETE RESTRICT,
                name TEXT NOT NULL,
                account_type account_type NOT NULL,
                currency CHAR(3) NOT NULL DEFAULT 'USD',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS ledger_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                reference_id UUID,
                reference_type TEXT,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS ledger_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
                account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
                amount_cents BIGINT NOT NULL,
                entry_type entry_type NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        // Applications + analytics
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
                influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'PENDING',
                reviewed_at TIMESTAMPTZ,
                pitch TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS analytics_data (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
                reach BIGINT DEFAULT 0,
                engagement BIGINT DEFAULT 0,
                clicks BIGINT DEFAULT 0,
                conversions BIGINT DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // ── Sprint 3: Milestones ────────────────────────────────────────────
        await client.query(`
            DO $$ BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='milestone_status') THEN
                CREATE TYPE milestone_status AS ENUM('PENDING','IN_PROGRESS','SUBMITTED','APPROVED','RELEASED');
              END IF;
            END $$;
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS milestones (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
                application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
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
        `);
        console.log('✅ milestones table');

        // ── Sprint 3: Notifications ─────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type       TEXT NOT NULL,
                title      TEXT NOT NULL,
                body       TEXT,
                link       TEXT,
                metadata   JSONB DEFAULT '{}',
                is_read    BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ notifications table');

        // ── Sprint 4: Creator Badges ────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS creator_badges (
                creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                badge_code  TEXT NOT NULL,
                awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (creator_id, badge_code)
            );
        `);
        console.log('✅ creator_badges table');
        // Sprint 2 tasks table — deferred until after campaigns exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agency_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                creator_id  UUID REFERENCES users(id) ON DELETE SET NULL,
                campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
                assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
                title       TEXT NOT NULL,
                description TEXT,
                status      task_status NOT NULL DEFAULT 'TODO',
                due_at      TIMESTAMPTZ,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ All tables created');

        // ── Stored Functions ────────────────────────────────────────────────

        // Sprint 4: XP + Trust Score + Badge recomputation
        await client.query(`
            CREATE OR REPLACE FUNCTION recompute_creator_level(p_user_id UUID)
            RETURNS VOID LANGUAGE plpgsql AS $$
            DECLARE
                v_accepted      INT;
                v_completed     INT;
                v_on_time       INT;
                v_late          INT;
                v_new_xp        INT;
                v_new_level     INT;
                v_new_trust     INT;
                v_profile_id    UUID;
            BEGIN
                -- Count accepted applications for this creator
                SELECT COUNT(*) INTO v_accepted
                FROM applications WHERE influencer_id = p_user_id AND status = 'ACCEPTED';

                -- Count completed campaigns (settled)
                SELECT COUNT(DISTINCT a.campaign_id) INTO v_completed
                FROM applications a
                JOIN campaigns c ON c.id = a.campaign_id
                WHERE a.influencer_id = p_user_id AND a.status = 'ACCEPTED' AND c.status = 'SETTLED';

                -- Count on-time milestones (submitted before due_at)
                SELECT COUNT(*) INTO v_on_time
                FROM milestones m
                JOIN applications a ON a.id = m.application_id
                WHERE a.influencer_id = p_user_id
                  AND m.status = 'RELEASED'
                  AND (m.due_at IS NULL OR m.submitted_at <= m.due_at);

                -- Count late milestones
                SELECT COUNT(*) INTO v_late
                FROM milestones m
                JOIN applications a ON a.id = m.application_id
                WHERE a.influencer_id = p_user_id
                  AND m.status = 'RELEASED'
                  AND m.due_at IS NOT NULL AND m.submitted_at > m.due_at;

                -- XP formula (from PRODUCT_ANALYSIS.md):
                -- xp = (completed x 100) + (accepted x 25) + (on_time x 15) - (late x 20)
                v_new_xp := GREATEST(
                    0,
                    (v_completed * 100) + (v_accepted * 25) + (v_on_time * 15) - (v_late * 20)
                );

                -- Level formula: floor(sqrt(xp / 50))
                v_new_level := FLOOR(SQRT(v_new_xp::NUMERIC / 50));

                -- Trust score (0–100): weighted on completed + on-time ratio
                v_new_trust := LEAST(100, GREATEST(0,
                    CASE
                      WHEN (v_on_time + v_late) = 0 THEN 50 + LEAST(50, v_completed * 5)
                      ELSE ROUND(
                        (v_on_time::NUMERIC / (v_on_time + v_late) * 60)
                        + LEAST(40, v_completed * 4)
                      )
                    END
                ));

                -- Update the profile
                UPDATE profiles
                   SET xp = v_new_xp, trust_score = v_new_trust
                 WHERE user_id = p_user_id
                RETURNING id INTO v_profile_id;

                -- ── Auto-badge awards ──────────────────────────────────────
                -- FIRST_DEAL: first accepted application
                IF v_accepted >= 1 THEN
                    INSERT INTO creator_badges (creator_id, badge_code)
                    VALUES (p_user_id, 'FIRST_DEAL')
                    ON CONFLICT DO NOTHING;
                END IF;

                -- CAMPAIGN_5: 5 completed campaigns
                IF v_completed >= 5 THEN
                    INSERT INTO creator_badges (creator_id, badge_code)
                    VALUES (p_user_id, 'CAMPAIGN_5')
                    ON CONFLICT DO NOTHING;
                END IF;

                -- TRUSTED: trust score >= 80
                IF v_new_trust >= 80 THEN
                    INSERT INTO creator_badges (creator_id, badge_code)
                    VALUES (p_user_id, 'TRUSTED')
                    ON CONFLICT DO NOTHING;
                END IF;

                -- ON_TIME_STREAK: 10 on-time milestones
                IF v_on_time >= 10 THEN
                    INSERT INTO creator_badges (creator_id, badge_code)
                    VALUES (p_user_id, 'ON_TIME_STREAK')
                    ON CONFLICT DO NOTHING;
                END IF;
            END;
            $$;
        `);
        console.log('✅ recompute_creator_level() function');

        // Sprint 3: Milestone settlement — double-entry ledger transfer
        await client.query(`
            CREATE OR REPLACE FUNCTION release_milestone(p_milestone_id UUID)
            RETURNS VOID LANGUAGE plpgsql AS $$
            DECLARE
                v_milestone     milestones%ROWTYPE;
                v_campaign      campaigns%ROWTYPE;
                v_creator_id    UUID;
                v_escrow_acct   UUID;
                v_creator_acct  UUID;
                v_txn_id        UUID;
            BEGIN
                SELECT * INTO v_milestone FROM milestones WHERE id = p_milestone_id;
                IF NOT FOUND THEN RAISE EXCEPTION 'Milestone % not found', p_milestone_id; END IF;
                IF v_milestone.status = 'RELEASED' THEN
                    RAISE EXCEPTION 'Milestone already released';
                END IF;

                SELECT * INTO v_campaign FROM campaigns WHERE id = v_milestone.campaign_id;

                -- Resolve creator from application
                SELECT influencer_id INTO v_creator_id
                FROM applications WHERE id = v_milestone.application_id;

                -- Get or create escrow account for campaign owner
                SELECT id INTO v_escrow_acct FROM accounts
                WHERE owner_id = v_campaign.creator_id AND account_type = 'ESCROW' LIMIT 1;
                IF NOT FOUND THEN
                    INSERT INTO accounts (owner_id, name, account_type)
                    VALUES (v_campaign.creator_id, 'Escrow', 'ESCROW')
                    RETURNING id INTO v_escrow_acct;
                END IF;

                -- Get or create revenue account for creator
                SELECT id INTO v_creator_acct FROM accounts
                WHERE owner_id = v_creator_id AND account_type = 'REVENUE' LIMIT 1;
                IF NOT FOUND THEN
                    INSERT INTO accounts (owner_id, name, account_type)
                    VALUES (v_creator_id, 'Revenue', 'REVENUE')
                    RETURNING id INTO v_creator_acct;
                END IF;

                -- Double-entry: DEBIT escrow, CREDIT creator revenue
                INSERT INTO ledger_transactions (reference_id, reference_type, description)
                VALUES (p_milestone_id, 'MILESTONE', 'Milestone release: ' || v_milestone.title)
                RETURNING id INTO v_txn_id;

                INSERT INTO ledger_entries (transaction_id, account_id, amount_cents, entry_type)
                VALUES
                    (v_txn_id, v_escrow_acct,  v_milestone.amount_cents, 'DEBIT'),
                    (v_txn_id, v_creator_acct, v_milestone.amount_cents, 'CREDIT');

                -- Mark milestone as released
                UPDATE milestones
                   SET status = 'RELEASED', approved_at = NOW(), released_at = NOW()
                 WHERE id = p_milestone_id;

                -- Recompute creator's XP/trust
                IF v_creator_id IS NOT NULL THEN
                    PERFORM recompute_creator_level(v_creator_id);
                END IF;
            END;
            $$;
        `);
        console.log('✅ release_milestone() function');

        // ── Sprint 5: Audit Log ─────────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id UUID,
                changes JSONB,
                ip_address TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ audit_logs table');


        // ── Sprint 5: Views for Analytics & Leaderboards ────────────────────
        await client.query(`
            CREATE OR REPLACE VIEW creator_monthly_earnings AS
            SELECT 
                a.owner_id AS creator_id,
                date_trunc('month', t.created_at)::date AS month,
                SUM(e.amount_cents) AS amount_cents,
                COUNT(e.id) AS entry_count
            FROM ledger_entries e
            JOIN ledger_transactions t ON t.id = e.transaction_id
            JOIN accounts a ON a.id = e.account_id
            WHERE a.account_type = 'REVENUE' AND e.entry_type = 'CREDIT'
            GROUP BY 1, 2;
        `);
        console.log('✅ creator_monthly_earnings view');

        await client.query(`
            CREATE OR REPLACE VIEW agency_metrics AS
            SELECT
                p.user_id AS agency_id,
                p.full_name AS agency_name,
                (SELECT COUNT(*) FROM agency_creators ac WHERE ac.agency_id = p.user_id AND ac.status = 'ACCEPTED') AS roster_size,
                (SELECT COUNT(*) FROM campaigns c WHERE c.creator_id = p.user_id) AS campaign_count,
                (SELECT COUNT(*) FROM campaigns c WHERE c.creator_id = p.user_id AND c.status = 'SETTLED') AS settled_count,
                (SELECT COUNT(*) FROM applications a JOIN campaigns c ON c.id = a.campaign_id WHERE c.creator_id = p.user_id AND a.status = 'ACCEPTED') AS accepted_apps,
                COALESCE((
                    SELECT SUM(e.amount_cents)
                    FROM ledger_entries e
                    JOIN ledger_transactions t ON t.id = e.transaction_id
                    JOIN accounts a ON a.id = e.account_id
                    WHERE a.owner_id = p.user_id AND a.account_type = 'ESCROW' AND e.entry_type = 'DEBIT'
                ), 0) AS total_paid_cents
            FROM profiles p
            JOIN users u ON u.id = p.user_id
            WHERE u.role = 'AGENCY' AND p.full_name IS NOT NULL;
        `);
        console.log('✅ agency_metrics view');


        // ── Indexes ──
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
            `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug)`,
            `CREATE INDEX IF NOT EXISTS idx_profiles_niche ON profiles(niche)`,
            `CREATE INDEX IF NOT EXISTS idx_profiles_available ON profiles(is_available) WHERE is_available = true`,
            `CREATE INDEX IF NOT EXISTS idx_social_accounts_profile_id ON social_accounts(profile_id)`,
            `CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`,
            `CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_creators_agency  ON agency_creators(agency_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_creators_creator ON agency_creators(creator_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_creators_status  ON agency_creators(status)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_members_agency   ON agency_members(agency_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_members_user     ON agency_members(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agency_notes_agency_creator ON agency_notes(agency_id, creator_id)`,
            `CREATE INDEX IF NOT EXISTS idx_tasks_agency    ON tasks(agency_id)`,
            `CREATE INDEX IF NOT EXISTS idx_tasks_creator   ON tasks(creator_id)`,
            `CREATE INDEX IF NOT EXISTS idx_tasks_campaign  ON tasks(campaign_id)`,
            `CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON tasks(assignee_id)`,
            `CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`,
            `CREATE INDEX IF NOT EXISTS idx_negotiations_campaign ON negotiations(campaign_id)`,
            `CREATE INDEX IF NOT EXISTS idx_negotiation_events_neg_id ON negotiation_events(negotiation_id)`,
            `CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id)`,
            `CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id ON ledger_entries(account_id)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON notifications(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON notifications(user_id, is_read) WHERE is_read = false`,
            `CREATE INDEX IF NOT EXISTS idx_milestones_application   ON milestones(application_id)`,
            `CREATE INDEX IF NOT EXISTS idx_milestones_campaign      ON milestones(campaign_id)`,
            `CREATE INDEX IF NOT EXISTS idx_milestones_status        ON milestones(status)`,
            `CREATE INDEX IF NOT EXISTS idx_creator_badges_creator   ON creator_badges(creator_id)`,
            `CREATE INDEX IF NOT EXISTS idx_applications_campaign    ON applications(campaign_id)`,
            `CREATE INDEX IF NOT EXISTS idx_applications_influencer  ON applications(influencer_id)`,
            `CREATE INDEX IF NOT EXISTS idx_applications_status      ON applications(status)`,
        ];
        for (const sql of indexes) await client.query(sql);
        console.log('✅ Indexes');

        // ── Triggers (safe: drop first) ──
        const triggers = [
            { name: 'trg_users_updated_at', table: 'users' },
            { name: 'trg_profiles_updated_at', table: 'profiles' },
            { name: 'trg_campaigns_updated_at', table: 'campaigns' },
            { name: 'trg_negotiations_updated_at', table: 'negotiations' },
            { name: 'trg_agency_notes_updated_at', table: 'agency_notes' },
            { name: 'trg_tasks_updated_at', table: 'tasks' },
        ];
        for (const t of triggers) {
            await client.query(`DROP TRIGGER IF EXISTS ${t.name} ON ${t.table}`);
            await client.query(`CREATE TRIGGER ${t.name} BEFORE UPDATE ON ${t.table} FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
        }
        const immutableTriggers = [
            { name: 'trg_lock_ledger_entries', table: 'ledger_entries' },
            { name: 'trg_lock_ledger_transactions', table: 'ledger_transactions' },
            { name: 'trg_lock_negotiation_events', table: 'negotiation_events' },
        ];
        for (const t of immutableTriggers) {
            await client.query(`DROP TRIGGER IF EXISTS ${t.name} ON ${t.table}`);
            await client.query(`CREATE TRIGGER ${t.name} BEFORE UPDATE OR DELETE ON ${t.table} FOR EACH ROW EXECUTE FUNCTION prevent_modification()`);
        }
        console.log('✅ Triggers');

        await client.query('COMMIT');
        console.log('\n🏗️  Schema creation complete!\n');

        // ── Seed Data ──
        console.log('🌱 Seeding demo data...\n');

        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        if (parseInt(userCount.rows[0].count) > 0) {
            console.log('⚠️  Data already exists. Skipping seed.');
        } else {
            await client.query('BEGIN');
            const passwordHash = await bcrypt.hash('password123', 10);

            // Users
            const u1 = await client.query(
                `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'INFLUENCER') RETURNING id`,
                ['ayse@imbass.com', passwordHash]
            );
            const u2 = await client.query(
                `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'INFLUENCER') RETURNING id`,
                ['mehmet@imbass.com', passwordHash]
            );
            const u3 = await client.query(
                `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'AGENCY') RETURNING id`,
                ['brand@agency.com', passwordHash]
            );
            const u4 = await client.query(
                `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'PRODUCER') RETURNING id`,
                ['producer@imbass.com', passwordHash]
            );
            console.log('  ✅ 4 users');

            // Profiles — with marketplace fields (slug, niche, trust, xp)
            const p1 = await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email, slug, niche, is_available, is_verified, trust_score, xp)
                 VALUES ($1, 'Ayşe Yılmaz', 'Fashion & Lifestyle Creator', 'İstanbul, TR', 'ayse@imbass.com', 'ayse-yilmaz', 'Fashion',   true,  true, 88, 4200)
                 RETURNING id`,
                [u1.rows[0].id]
            );
            const p2 = await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email, slug, niche, is_available, is_verified, trust_score, xp)
                 VALUES ($1, 'Mehmet Kaya', 'Tech Reviewer & Vlogger',   'Ankara, TR',   'mehmet@imbass.com', 'mehmet-kaya', 'Tech',    true,  true, 91, 5800)
                 RETURNING id`,
                [u2.rows[0].id]
            );
            await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email, slug, niche, is_available, trust_score, xp)
                 VALUES ($1, 'Digital Agency Co.', 'Full-service influencer marketing agency', 'İstanbul, TR', 'brand@agency.com', 'digital-agency', 'Marketing', true, 79, 2100)`,
                [u3.rows[0].id]
            );
            await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email, slug, niche, is_available, trust_score, xp)
                 VALUES ($1, 'Ahmet Demir',        'Music & Video Producer', 'İzmir, TR', 'producer@imbass.com', 'ahmet-demir',    'Music',     false, 83, 3200)`,
                [u4.rows[0].id]
            );
            console.log('  ✅ 4 profiles');

            // Social Accounts
            await client.query(
                `INSERT INTO social_accounts (profile_id, platform, username, follower_count) VALUES ($1, 'INSTAGRAM', '@ayseyilmaz', 1200000)`,
                [p1.rows[0].id]
            );
            await client.query(
                `INSERT INTO social_accounts (profile_id, platform, username, follower_count) VALUES ($1, 'YOUTUBE', 'AyseVlogs', 850000)`,
                [p1.rows[0].id]
            );
            await client.query(
                `INSERT INTO social_accounts (profile_id, platform, username, follower_count) VALUES ($1, 'YOUTUBE', 'MehmetTech', 2100000)`,
                [p2.rows[0].id]
            );
            await client.query(
                `INSERT INTO social_accounts (profile_id, platform, username, follower_count) VALUES ($1, 'TIKTOK', '@mehmetkaya', 3500000)`,
                [p2.rows[0].id]
            );
            console.log('  ✅ 4 social accounts');

            // Campaigns
            const c1 = await client.query(
                `INSERT INTO campaigns (creator_id, title, description, budget_cents, status) VALUES ($1, 'Summer Fashion Drop', 'Promote summer collection across Instagram', 500000, 'ACTIVE') RETURNING id`,
                [u3.rows[0].id]
            );
            const c2 = await client.query(
                `INSERT INTO campaigns (creator_id, title, description, budget_cents, status) VALUES ($1, 'Tech Gadget Review', 'Unboxing and review of new smartphone', 300000, 'ACTIVE') RETURNING id`,
                [u3.rows[0].id]
            );
            const c3 = await client.query(
                `INSERT INTO campaigns (creator_id, title, description, budget_cents, status) VALUES ($1, 'Music Festival Promo', 'Festival ticket giveaway campaign', 150000, 'DRAFT') RETURNING id`,
                [u4.rows[0].id]
            );
            console.log('  ✅ 3 campaigns');

            // Applications + Analytics
            const app1 = await client.query(
                `INSERT INTO applications (campaign_id, influencer_id, status) VALUES ($1, $2, 'ACCEPTED') RETURNING id`,
                [c1.rows[0].id, u1.rows[0].id]
            );
            const app2 = await client.query(
                `INSERT INTO applications (campaign_id, influencer_id, status) VALUES ($1, $2, 'ACCEPTED') RETURNING id`,
                [c2.rows[0].id, u2.rows[0].id]
            );
            const app3 = await client.query(
                `INSERT INTO applications (campaign_id, influencer_id, status) VALUES ($1, $2, 'PENDING') RETURNING id`,
                [c1.rows[0].id, u2.rows[0].id]
            );
            console.log('  ✅ 3 applications');

            await client.query(
                `INSERT INTO analytics_data (application_id, reach, engagement, clicks, conversions) VALUES ($1, 450000, 32000, 8500, 1200)`,
                [app1.rows[0].id]
            );
            await client.query(
                `INSERT INTO analytics_data (application_id, reach, engagement, clicks, conversions) VALUES ($1, 680000, 45000, 12000, 2800)`,
                [app2.rows[0].id]
            );
            await client.query(
                `INSERT INTO analytics_data (application_id, reach, engagement, clicks, conversions) VALUES ($1, 120000, 8000, 2000, 350)`,
                [app3.rows[0].id]
            );
            console.log('  ✅ 3 analytics records');

            // Sprint 2: Agency roster demo — brand@agency.com has Ayşe on the
            // roster (accepted), Mehmet pending, plus one note and one task.
            await client.query(
                `INSERT INTO agency_creators (agency_id, creator_id, status, joined_at)
                 VALUES ($1, $2, 'ACCEPTED', NOW())`,
                [u3.rows[0].id, u1.rows[0].id]
            );
            await client.query(
                `INSERT INTO agency_creators (agency_id, creator_id, status)
                 VALUES ($1, $2, 'INVITED')`,
                [u3.rows[0].id, u2.rows[0].id]
            );
            await client.query(
                `INSERT INTO agency_notes (agency_id, creator_id, author_id, body, is_pinned)
                 VALUES ($1, $2, $1, 'Great engagement on Q1 fashion drop — renew for Q2.', true)`,
                [u3.rows[0].id, u1.rows[0].id]
            );
            await client.query(
                `INSERT INTO tasks (agency_id, creator_id, title, status, due_at)
                 VALUES ($1, $2, 'Brief Ayşe on Summer campaign', 'TODO', NOW() + INTERVAL '3 days')`,
                [u3.rows[0].id, u1.rows[0].id]
            );
            console.log('  ✅ Agency roster (2 rows), 1 note, 1 task');

            await client.query('COMMIT');
            console.log('\n🌱 Seed complete!');
        }

        console.log('\n══════════════════════════════════════');
        console.log('  ✅ IMBASS Database is READY!');
        console.log('  📦 11 tables created');
        console.log('  👤 Demo login: ayse@imbass.com / password123');
        console.log('══════════════════════════════════════\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Setup failed:', err.message);
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
