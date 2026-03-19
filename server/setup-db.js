/**
 * IMBASS Database Setup Script
 * Creates all tables, types, triggers, and seeds initial data into Docker PostgreSQL.
 * Run: node server/setup-db.js
 */
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
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
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
        // Analytics data table (needed by existing routes)
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
                influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'PENDING',
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
        // Social accounts now created above
        console.log('✅ All tables created');

        // ── Indexes ──
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
            `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_social_accounts_profile_id ON social_accounts(profile_id)`,
            `CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`,
            `CREATE INDEX IF NOT EXISTS idx_negotiations_campaign ON negotiations(campaign_id)`,
            `CREATE INDEX IF NOT EXISTS idx_negotiation_events_neg_id ON negotiation_events(negotiation_id)`,
            `CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id)`,
            `CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id ON ledger_entries(account_id)`,
        ];
        for (const sql of indexes) await client.query(sql);
        console.log('✅ Indexes');

        // ── Triggers (safe: drop first) ──
        const triggers = [
            { name: 'trg_users_updated_at', table: 'users' },
            { name: 'trg_profiles_updated_at', table: 'profiles' },
            { name: 'trg_campaigns_updated_at', table: 'campaigns' },
            { name: 'trg_negotiations_updated_at', table: 'negotiations' },
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

            // Profiles
            const p1 = await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email) VALUES ($1, 'Ayşe Yılmaz', 'Fashion & Lifestyle Creator', 'İstanbul, TR', 'ayse@imbass.com') RETURNING id`,
                [u1.rows[0].id]
            );
            const p2 = await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email) VALUES ($1, 'Mehmet Kaya', 'Tech Reviewer & Vlogger', 'Ankara, TR', 'mehmet@imbass.com') RETURNING id`,
                [u2.rows[0].id]
            );
            await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email) VALUES ($1, 'Digital Agency Co.', 'Full-service influencer marketing agency', 'İstanbul, TR', 'brand@agency.com')`,
                [u3.rows[0].id]
            );
            await client.query(
                `INSERT INTO profiles (user_id, full_name, bio, location, contact_email) VALUES ($1, 'Ahmet Demir', 'Music & Video Producer', 'İzmir, TR', 'producer@imbass.com')`,
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
