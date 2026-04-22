-- ============================================================================
-- Enable Row Level Security on all public tables
-- Fixes Supabase linter errors:
--   - rls_disabled_in_public (9 tables)
--   - sensitive_columns_exposed (users.refresh_token)
--
-- Backend connects with service_role / table owner, which bypasses RLS.
-- Without policies, anon/authenticated roles get default-deny — no direct
-- client-side access to these tables. All reads/writes must go through the
-- Express API.
--
-- Idempotent. Safe to run multiple times:
--   docker exec -i imbass_postgres psql -U imbass -d imbass < server/migrations/006_enable_rls.sql
-- ============================================================================

BEGIN;

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries       ENABLE ROW LEVEL SECURITY;

COMMIT;
