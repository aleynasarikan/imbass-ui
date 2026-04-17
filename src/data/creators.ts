export type CreatorPlatform = 'instagram' | 'youtube' | 'tiktok';

export interface MockCreator {
  id: string;
  slug: string;
  name: string;
  handle: string;
  bio: string;
  location: string;
  platforms: CreatorPlatform[];
  followers: number;
  xp: number;
  trust: number;
  niche: string;
  available: boolean;
  joinedYear: number;
  streak: number;
}

export const CREATORS: MockCreator[] = [
  { id: '1',  slug: 'alex-h',    name: 'Alex H.',   handle: 'alexh',     bio: 'Streetwear haulings + unboxings.',            location: 'Istanbul',  platforms: ['instagram','tiktok'],           followers:  28_000, xp: 1_850, trust: 82, niche: 'Fashion',        available: true,  joinedYear: 2025, streak:  7 },
  { id: '2',  slug: 'nataly',    name: 'Nataly H.', handle: 'nataly.h',  bio: 'Skincare deep-dives, product reviews.',       location: 'Ankara',    platforms: ['instagram','youtube'],          followers: 142_000, xp: 5_800, trust: 91, niche: 'Beauty',         available: true,  joinedYear: 2023, streak: 22 },
  { id: '3',  slug: 'jack-m',    name: 'Jack M.',   handle: 'jackm.dev', bio: 'Dev tools, keyboards, coding gear.',          location: 'Berlin',    platforms: ['youtube'],                      followers:   9_400, xp:   980, trust: 76, niche: 'Tech',           available: false, joinedYear: 2024, streak:  3 },
  { id: '4',  slug: 'erick-a',   name: 'Erick A.',  handle: 'erick.a',   bio: 'Travel cinematography across Europe.',        location: 'Paris',     platforms: ['instagram','youtube','tiktok'], followers:  53_000, xp: 3_240, trust: 88, niche: 'Travel',         available: true,  joinedYear: 2022, streak: 14 },
  { id: '5',  slug: 'adam-f',    name: 'Adam F.',   handle: 'adamfit',   bio: 'Home workouts + supplement reviews.',         location: 'London',    platforms: ['instagram','tiktok'],           followers: 310_000, xp: 9_100, trust: 94, niche: 'Fitness',        available: true,  joinedYear: 2021, streak: 41 },
  { id: '6',  slug: 'kim-h',     name: 'Kim H.',    handle: 'kim.h',     bio: 'Food tours & recipe drops, weekly.',          location: 'Seoul',     platforms: ['youtube','tiktok'],             followers:  17_000, xp: 1_120, trust: 79, niche: 'Food',           available: true,  joinedYear: 2024, streak:  9 },
  { id: '7',  slug: 'anna-p',    name: 'Anna P.',   handle: 'anna.p',    bio: 'Indie bookstore + writing life vlogs.',        location: 'Dublin',    platforms: ['instagram'],                     followers:  72_000, xp: 2_640, trust: 85, niche: 'Lifestyle',      available: false, joinedYear: 2023, streak:  5 },
  { id: '8',  slug: 'rita-o',    name: 'Rita O.',   handle: 'rita.o',    bio: 'Sustainability, slow fashion, second-hand.',  location: 'Lisbon',    platforms: ['instagram','youtube'],          followers:  44_000, xp: 2_100, trust: 90, niche: 'Sustainability', available: true,  joinedYear: 2022, streak: 18 },
  { id: '9',  slug: 'mert-k',    name: 'Mert K.',   handle: 'mertk',     bio: 'Gaming reviews & livestream highlights.',     location: 'Izmir',     platforms: ['youtube','tiktok'],             followers: 128_000, xp: 4_800, trust: 87, niche: 'Gaming',         available: true,  joinedYear: 2022, streak: 28 },
  { id: '10', slug: 'sara-t',    name: 'Sara T.',   handle: 'sara.t',    bio: 'Finance explainers for Gen Z.',               location: 'New York',  platforms: ['tiktok','instagram'],           followers:  89_000, xp: 3_600, trust: 86, niche: 'Finance',        available: false, joinedYear: 2023, streak: 11 },
  { id: '11', slug: 'deniz',     name: 'Deniz',     handle: 'denizmakes',bio: 'DIY, carpentry, workshop tools.',             location: 'Istanbul',  platforms: ['youtube'],                      followers:  62_000, xp: 2_900, trust: 83, niche: 'Maker',          available: true,  joinedYear: 2023, streak: 12 },
  { id: '12', slug: 'lea-w',     name: 'Lea W.',    handle: 'leawrites', bio: 'Book reviews, reading challenges, author Q&A.',location: 'Amsterdam', platforms: ['instagram','tiktok'],           followers:  24_000, xp: 1_480, trust: 80, niche: 'Lifestyle',      available: true,  joinedYear: 2024, streak:  8 },
];

export const NICHES = Array.from(new Set(CREATORS.map(c => c.niche))).sort();

export const PLATFORMS: Array<{ key: CreatorPlatform; label: string }> = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'tiktok',    label: 'TikTok' },
];

export const getCreatorBySlug = (slug: string): MockCreator | undefined =>
  CREATORS.find(c => c.slug === slug);

/**
 * Adapter: backend CreatorDTO → frontend MockCreator shape.
 * Fields not yet present server-side (handle, joinedYear, streak) get safe defaults.
 */
export function dtoToMockCreator(d: {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  location: string | null;
  niche: string | null;
  isAvailable: boolean;
  trustScore: number;
  xp: number;
  followerCount: number;
  platforms: Array<{ platform: string }>;
}): MockCreator {
  const plats = d.platforms
    .map(p => p.platform.toLowerCase())
    .filter((p): p is CreatorPlatform => p === 'instagram' || p === 'youtube' || p === 'tiktok');

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    handle: d.slug,                  // no handle column yet — use slug as fallback
    bio: d.bio ?? '',
    location: d.location ?? '—',
    platforms: plats,
    followers: d.followerCount,
    xp: d.xp,
    trust: d.trustScore,
    niche: d.niche ?? 'Other',
    available: d.isAvailable,
    joinedYear: new Date().getFullYear(),
    streak: 0,
  };
}

export const formatFollowers = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${n}`;
};
