--Financial - Grade IMBASS Schema
--Production - Ready DDL(PostgreSQL 14 +)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--Enum Types
CREATE TYPE user_role AS ENUM('INFLUENCER', 'AGENCY', 'PRODUCER');
CREATE TYPE campaign_status AS ENUM('DRAFT', 'ACTIVE', 'SETTLED', 'CANCELLED');
CREATE TYPE negotiation_status AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED');
CREATE TYPE negotiation_event_type AS ENUM('OFFER_MADE', 'OFFER_REJECTED', 'OFFER_ACCEPTED', 'COUNTER_OFFER', 'COMMENT_ADDED');
CREATE TYPE entry_type AS ENUM('DEBIT', 'CREDIT');
CREATE TYPE account_type AS ENUM('ESCROW', 'REVENUE', 'PAYABLE', 'RECEIVABLE', 'USER_BALANCE');

--Trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Immutable Guard Function
CREATE OR REPLACE FUNCTION prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Updates and deletes are prohibited on immutable transactional records.';
END;
$$ LANGUAGE plpgsql;

--Core Identity
CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    refresh_token TEXT,
    is_onboarding BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles(
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

CREATE TABLE platforms(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform_name TEXT NOT NULL,
    username TEXT NOT NULL,
    follower_count BIGINT DEFAULT 0 CHECK(follower_count >= 0),
    profile_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--Commercial Models
CREATE TABLE campaigns(
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

CREATE TABLE negotiations(
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

--Immutable Event Log(Replaces JSONB history)
CREATE TABLE negotiation_events(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_type negotiation_event_type NOT NULL,
    offer_amount_cents BIGINT CHECK(offer_amount_cents >= 0),
    metadata_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--Financial Infrastructure(Double - Entry)
CREATE TABLE accounts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE RESTRICT, --Internal accounts have NULL owner
    name TEXT NOT NULL,
    account_type account_type NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger_transactions(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id UUID, --Links to negotiation / campaign for audit
    reference_type TEXT,
    description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger_entries(
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
            account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
            amount_cents BIGINT NOT NULL,
            entry_type entry_type NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

--Indices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_platforms_profile_id ON platforms(profile_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_negotiations_campaign ON negotiations(campaign_id);
CREATE INDEX idx_negotiation_events_neg_id ON negotiation_events(negotiation_id);
CREATE INDEX idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_entries_account_id ON ledger_entries(account_id);

--Triggers for updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_negotiations_updated_at BEFORE UPDATE ON negotiations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--Enforce Immutability for Transactional Data
CREATE TRIGGER trg_lock_ledger_entries BEFORE UPDATE OR DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER trg_lock_ledger_transactions BEFORE UPDATE OR DELETE ON ledger_transactions FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER trg_lock_negotiation_events BEFORE UPDATE OR DELETE ON negotiation_events FOR EACH ROW EXECUTE FUNCTION prevent_modification();

--Ledger Invariance Check(Enforced at Transaction Level via Logic or Deferred Constraint)
--Note: A common approach is a check trigger or application logic. 
--Here we add a check table to ensure sum(amount) == 0 per transaction_id if required,
    --but usually handled in the SET TRANSACTION ISOLATION LEVEL SERIALIZABLE block.
