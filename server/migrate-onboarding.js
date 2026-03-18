/**
 * Migration: Add onboarding support to existing IMBASS database
 * Run: node server/migrate-onboarding.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to PostgreSQL.');
        console.log('🏗️  Running onboarding migration...\n');

        await client.query('BEGIN');

        // Add is_onboarding column to users
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarding BOOLEAN NOT NULL DEFAULT false
        `);
        console.log('✅ Added is_onboarding to users');

        // Add company_name and logo_url to profiles
        await client.query(`
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT
        `);
        await client.query(`
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT
        `);
        console.log('✅ Added company_name, logo_url to profiles');

        // Create social_accounts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS social_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                platform TEXT NOT NULL,
                username TEXT NOT NULL,
                profile_url TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_social_accounts_profile_id ON social_accounts(profile_id)
        `);
        console.log('✅ Created social_accounts table');

        await client.query('COMMIT');

        console.log('\n══════════════════════════════════════');
        console.log('  ✅ Onboarding migration complete!');
        console.log('══════════════════════════════════════\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err.message);
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
