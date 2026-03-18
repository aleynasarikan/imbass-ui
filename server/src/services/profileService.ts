import { query, getClient } from '../db';
import { Profile } from '../types';

export const getMyProfile = async (userId: string) => {
  const result = await query(
    'SELECT profiles.*, users.email, users.role FROM profiles JOIN users ON profiles.user_id = users.id WHERE users.id = $1',
    [userId]
  );
  const profile = result.rows[0];

  if (!profile) {
    throw { statusCode: 404, message: 'Profile not found' };
  }

  const platformsResult = await query('SELECT * FROM platforms WHERE profile_id = $1', [profile.id]);
  const platforms = platformsResult.rows;

  const platformsObj = {
    youtube: platforms.some((p: any) => p.platform_name === 'YOUTUBE'),
    instagram: platforms.some((p: any) => p.platform_name === 'INSTAGRAM'),
    tiktok: platforms.some((p: any) => p.platform_name === 'TIKTOK')
  };

  return {
    name: profile.full_name,
    role: profile.role,
    email: profile.email,
    contactEmail: profile.contact_email,
    bio: profile.bio,
    location: profile.location,
    platforms: platformsObj,
    rawPlatforms: platforms
  };
};

export const updateMyProfile = async (
  userId: string,
  data: { name: string; bio?: string | null; location?: string | null; email: string; platforms?: { youtube?: boolean; instagram?: boolean; tiktok?: boolean } }
) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const profileResult = await client.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
    const profile = profileResult.rows[0];
    if (!profile) {
      await client.query('ROLLBACK');
      throw { statusCode: 404, message: 'Profile not found' };
    }

    await client.query(
      'UPDATE profiles SET full_name = $1, bio = $2, location = $3, contact_email = $4 WHERE user_id = $5',
      [data.name, data.bio || null, data.location || null, data.email, userId]
    );

    await client.query('UPDATE users SET email = $1 WHERE id = $2', [data.email, userId]);
    await client.query('DELETE FROM platforms WHERE profile_id = $1', [profile.id]);

    if (data.platforms) {
      const platformEntries = [
        { key: 'youtube', name: 'YOUTUBE' },
        { key: 'instagram', name: 'INSTAGRAM' },
        { key: 'tiktok', name: 'TIKTOK' }
      ] as const;

      for (const p of platformEntries) {
        if (data.platforms[p.key]) {
          await client.query(
            'INSERT INTO platforms (profile_id, platform_name, username) VALUES ($1, $2, $3)',
            [profile.id, p.name, `User_${p.key}`]
          );
        }
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
