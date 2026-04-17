import { useEffect, useState, useSyncExternalStore } from 'react';
import { followCreator as apiFollow, unfollowCreator as apiUnfollow, listMyFollows } from '../../api/creators';

const STORAGE_KEY_FOLLOWS  = 'imbass:follows';
const STORAGE_KEY_SLUG_MAP = 'imbass:slug-to-user';

/* ─── Singleton store ─── */

type Listener = () => void;

class FollowStore {
  private set: Set<string>;
  private slugToUser: Map<string, string>;   // slug → user_id (for server calls)
  private listeners: Set<Listener> = new Set();
  private syncEnabled = true;                // set false if backend is known down

  constructor() {
    this.set = readSet(STORAGE_KEY_FOLLOWS);
    this.slugToUser = readMap(STORAGE_KEY_SLUG_MAP);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_FOLLOWS)  { this.set = readSet(STORAGE_KEY_FOLLOWS); this.emit(); }
    if (e.key === STORAGE_KEY_SLUG_MAP) { this.slugToUser = readMap(STORAGE_KEY_SLUG_MAP); this.emit(); }
  };

  subscribe = (cb: Listener): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  private emit = () => { this.listeners.forEach(l => l()); };

  private persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLLOWS,  JSON.stringify(Array.from(this.set)));
      localStorage.setItem(STORAGE_KEY_SLUG_MAP, JSON.stringify(Array.from(this.slugToUser.entries())));
    } catch { /* quota / private mode */ }
  };

  getSnapshot = (): ReadonlySet<string> => this.set;

  has = (slug: string): boolean => this.set.has(slug);

  size = (): number => this.set.size;

  /** Remember a slug → userId mapping so later toggles can hit the server. */
  registerCreator = (slug: string, userId?: string | null) => {
    if (!userId) return;
    if (this.slugToUser.get(slug) === userId) return;
    this.slugToUser = new Map(this.slugToUser).set(slug, userId);
    this.persist();
  };

  follow = (slug: string, userId?: string | null) => {
    if (userId) this.registerCreator(slug, userId);
    if (this.set.has(slug)) return;
    this.set = new Set(this.set).add(slug);
    this.persist();
    this.emit();
    void this.syncFollow(slug);
  };

  unfollow = (slug: string) => {
    if (!this.set.has(slug)) return;
    const next = new Set(this.set);
    next.delete(slug);
    this.set = next;
    this.persist();
    this.emit();
    void this.syncUnfollow(slug);
  };

  toggle = (slug: string, userId?: string | null): boolean => {
    if (this.set.has(slug)) {
      this.unfollow(slug);
      return false;
    }
    this.follow(slug, userId);
    return true;
  };

  clear = () => {
    const slugs = Array.from(this.set);
    this.set = new Set();
    this.persist();
    this.emit();
    slugs.forEach(s => { void this.syncUnfollow(s); });
  };

  /**
   * Hydrate from `/api/me/follows`. Merges server state with any local-only
   * follows (posts them to the server).
   * Call this after login.
   */
  hydrateFromServer = async (): Promise<void> => {
    try {
      const serverList = await listMyFollows();
      const serverSlugs = new Set<string>();
      for (const c of serverList) {
        serverSlugs.add(c.slug);
        this.slugToUser.set(c.slug, c.userId);
      }

      // Local-only follows → push to server
      const localOnly = Array.from(this.set).filter(s => !serverSlugs.has(s));
      await Promise.all(localOnly.map(async slug => {
        const uid = this.slugToUser.get(slug);
        if (uid) {
          try { await apiFollow(uid); } catch { /* fire-and-forget */ }
        }
      }));

      // Merge: server set ∪ local-only (pushed above)
      this.set = new Set([...Array.from(serverSlugs), ...localOnly]);
      this.syncEnabled = true;
      this.persist();
      this.emit();
    } catch {
      // Backend unreachable — keep local, disable future sync for this session
      this.syncEnabled = false;
    }
  };

  /** Called on logout — drop everything. */
  reset = () => {
    this.set = new Set();
    this.slugToUser = new Map();
    this.persist();
    this.emit();
  };

  /* ─── Internal sync helpers ─── */

  private syncFollow = async (slug: string) => {
    if (!this.syncEnabled) return;
    const uid = this.slugToUser.get(slug);
    if (!uid) return;
    try { await apiFollow(uid); }
    catch { this.syncEnabled = false; } // stop nagging a dead backend
  };

  private syncUnfollow = async (slug: string) => {
    if (!this.syncEnabled) return;
    const uid = this.slugToUser.get(slug);
    if (!uid) return;
    try { await apiUnfollow(uid); }
    catch { this.syncEnabled = false; }
  };
}

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x: unknown) => typeof x === 'string')) : new Set();
  } catch { return new Set(); }
}

function readMap(key: string): Map<string, string> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Map();
    return new Map(parsed.filter(
      (e: unknown): e is [string, string] =>
        Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string'
    ));
  } catch { return new Map(); }
}

export const followStore = new FollowStore();

/* ─── React hooks ─── */

export function useFollows(): {
  follows: ReadonlySet<string>;
  count: number;
  isFollowing: (slug: string) => boolean;
  follow: (slug: string, userId?: string | null) => void;
  unfollow: (slug: string) => void;
  toggle: (slug: string, userId?: string | null) => boolean;
  clear: () => void;
  registerCreator: (slug: string, userId?: string | null) => void;
} {
  const follows = useSyncExternalStore(
    followStore.subscribe,
    followStore.getSnapshot,
    followStore.getSnapshot,
  );
  return {
    follows,
    count: follows.size,
    isFollowing: (slug) => follows.has(slug),
    follow:   followStore.follow,
    unfollow: followStore.unfollow,
    toggle:   followStore.toggle,
    clear:    followStore.clear,
    registerCreator: followStore.registerCreator,
  };
}

export function useIsFollowing(slug: string): boolean {
  const [v, setV] = useState(() => followStore.has(slug));
  useEffect(() => {
    setV(followStore.has(slug));
    return followStore.subscribe(() => setV(followStore.has(slug)));
  }, [slug]);
  return v;
}
