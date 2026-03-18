"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeAgencyOnboarding = exports.completeInfluencerOnboarding = exports.getOnboardingStatus = void 0;
const db_1 = require("../db");
const getOnboardingStatus = async (userId) => {
    const result = await (0, db_1.query)('SELECT is_onboarding, role FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }
    return { isOnboarding: user.is_onboarding, role: user.role };
};
exports.getOnboardingStatus = getOnboardingStatus;
const completeInfluencerOnboarding = async (userId, data) => {
    const client = await (0, db_1.getClient)();
    try {
        await client.query('BEGIN');
        const profileResult = await client.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
        if (profileResult.rows.length === 0) {
            await client.query('ROLLBACK');
            throw { statusCode: 404, message: 'Profile not found' };
        }
        const profileId = profileResult.rows[0].id;
        await client.query('UPDATE profiles SET full_name = $1 WHERE user_id = $2', [data.username.trim(), userId]);
        if (data.socialAccounts?.length) {
            await client.query('DELETE FROM social_accounts WHERE profile_id = $1', [profileId]);
            for (const account of data.socialAccounts) {
                if (account.platform && account.username && account.username.trim()) {
                    await client.query('INSERT INTO social_accounts (profile_id, platform, username, profile_url) VALUES ($1, $2, $3, $4)', [profileId, account.platform.toUpperCase(), account.username.trim(), account.profileUrl || null]);
                }
            }
        }
        await client.query('UPDATE users SET is_onboarding = false WHERE id = $1', [userId]);
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.completeInfluencerOnboarding = completeInfluencerOnboarding;
const completeAgencyOnboarding = async (userId, data) => {
    const client = await (0, db_1.getClient)();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE profiles SET company_name = $1, logo_url = $2 WHERE user_id = $3', [data.companyName.trim(), data.logoUrl || null, userId]);
        await client.query('UPDATE users SET is_onboarding = false WHERE id = $1', [userId]);
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.completeAgencyOnboarding = completeAgencyOnboarding;
