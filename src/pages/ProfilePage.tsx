import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import {
  Camera, MapPin, Mail, Edit3, Save, X, Video, Image as ImageIcon, Music2,
  CheckCircle2, Sparkles, Globe2, BadgeCheck, Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import api from '../api';
import ActivityHeatmap from '../components/creator/ActivityHeatmap';
import CreatorLevelBadge from '../components/creator/CreatorLevelBadge';
import TrustScoreBadge from '../components/creator/TrustScoreBadge';

interface ProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  contactEmail?: string;
  platforms?: {
    youtube?: boolean;
    instagram?: boolean;
    tiktok?: boolean;
  };
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fallback: ProfileData = {
      id:    user?.id || 'local',
      userId: user?.id || 'local',
      name:  user?.email?.split('@')[0] || 'Editor',
      email: user?.email || 'editor@imbass.dev',
      role:  user?.role || 'AGENCY',
      bio:   'A short biography goes here — who you are, what you work on, and the kinds of partnerships you\'re open to.',
      location: 'Istanbul',
      platforms: { youtube: false, instagram: true, tiktok: false },
    };

    (async () => {
      try {
        const res = await api.get<ProfileData>('/profile/me');
        setProfile(res.data);
        setEditForm(res.data);
      } catch {
        setProfile(fallback);
        setEditForm(fallback);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editForm) setEditForm({ ...editForm, [name]: value });
  };

  const handlePlatformChange = (platform: keyof NonNullable<ProfileData['platforms']>) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      platforms: { ...editForm.platforms, [platform]: !editForm.platforms?.[platform] },
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try { await api.put('/profile/me', editForm); } catch { /* dev */ }
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => { setEditForm(profile); setIsEditing(false); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="meta-label">Loading profile…</span>
      </div>
    );
  }
  if (!profile || !editForm) return null;

  const platformItems = [
    { key: 'youtube',   label: 'YouTube',   icon: Video,      color: '#ff4d6d' },
    { key: 'instagram', label: 'Instagram', icon: ImageIcon,  color: '#e1306c' },
    { key: 'tiktok',    label: 'TikTok',    icon: Music2,     color: '#f5f5f7' },
  ] as const;

  const joined = new Date().getFullYear();
  const isInfluencer = profile.role === 'INFLUENCER';

  // Vanity stats for the profile surface
  const stats = [
    { k: 'Collaborations', v: '24' },
    { k: 'Followers',      v: '142K' },
    { k: 'Rating',         v: '4.9' },
  ];

  return (
    <form onSubmit={handleSave} className="max-w-[1200px] mx-auto animate-fade-in">
      {/* ═════ Head ═════ */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 font-sans text-[13px] text-text-mute">
            <span>You</span>
            <span className="text-text-faint">›</span>
            <span>Profile</span>
          </div>
          <h1 className="font-display text-[30px] md:text-[34px] font-semibold text-text tracking-[-0.02em] leading-tight">
            Profile
          </h1>
          <p className="font-sans text-[14px] text-text-mute mt-1.5">
            How you show up to brands, agencies, and creators across Imbass.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X size={12} strokeWidth={2.25} /> Cancel
              </Button>
              <Button type="submit">
                <Save size={12} strokeWidth={2.25} /> Save changes
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 size={12} strokeWidth={2.25} /> Edit profile
            </Button>
          )}
        </div>
      </div>

      {/* ═════ Hero card: banner + avatar + identity ═════ */}
      <div className="surface overflow-hidden mb-5 animate-rise-in">
        {/* Gradient banner */}
        <div className="relative h-[140px] bg-iris-grad">
          <div className="absolute inset-0 opacity-60" style={{
            background: `
              radial-gradient(400px 200px at 10% 0%, rgba(255,255,255,.35), transparent 60%),
              radial-gradient(380px 220px at 90% 100%, rgba(255,177,138,.45), transparent 60%)
            `
          }} />
          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[11px] font-medium border border-white/25">
            <Sparkles size={11} strokeWidth={2.25} /> {profile.role}
          </div>
        </div>

        {/* Identity row */}
        <div className="px-6 pb-6 -mt-10 flex flex-col md:flex-row md:items-end gap-5">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-float">
              <AvatarFallback className="text-[30px]">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-iris text-white rounded-full shadow-coral hover:bg-iris-deep transition"
              >
                <Camera size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                name="name"
                value={editForm.name || ''}
                onChange={handleInputChange}
                className="!h-11 !text-[22px] !font-display !font-semibold max-w-[480px]"
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-[26px] font-semibold text-text leading-tight">
                  {profile.name}
                </h2>
                <BadgeCheck size={18} className="text-iris" strokeWidth={2} />
                {isInfluencer && <TrustScoreBadge score={87} />}
              </div>
            )}

            <div className="mt-1.5 flex items-center gap-4 font-sans text-[13px] text-text-mute flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={12} strokeWidth={2} />
                {profile.email}
              </span>
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} strokeWidth={2} />
                  {profile.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Globe2 size={12} strokeWidth={2} />
                Joined {joined}
              </span>
            </div>
          </div>

          {/* Inline stats */}
          <div className="flex items-center gap-5 md:gap-6 md:border-l md:border-line md:pl-6">
            {stats.map(s => (
              <div key={s.k} className="min-w-[68px]">
                <div className="font-display text-[20px] font-semibold text-text tabular-nums leading-none">
                  {s.v}
                </div>
                <div className="font-sans text-[11px] text-text-mute mt-1">{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator level band — influencers only */}
        {isInfluencer && (
          <div className="px-6 pb-6">
            <div className="surface-sunk p-4 flex items-center gap-4">
              <CreatorLevelBadge xp={2180} className="flex-1" />
              <div className="hidden md:block h-10 w-px bg-line" />
              <div className="hidden md:flex items-center gap-2 text-text-mute">
                <Flame size={14} className="text-peach" strokeWidth={2} />
                <span className="font-sans text-[12.5px] font-medium text-text">14-day streak</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═════ Activity heatmap — influencers only ═════ */}
      {isInfluencer && (
        <section className="surface p-6 mb-5 animate-rise-in" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-display text-[16px] font-semibold text-text">Collaboration activity</h3>
              <p className="font-sans text-[12px] text-text-mute mt-0.5">
                Every deal, delivery, and collab lives here — your public track record.
              </p>
            </div>
          </div>
          <ActivityHeatmap year={new Date().getFullYear()} metric="collab" />
        </section>
      )}

      {/* ═════ 2-col content ═════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Main column */}
        <div className="flex flex-col gap-5">
          {/* About */}
          <section className="surface p-6 animate-rise-in" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[16px] font-semibold text-text">About</h3>
              <span className="font-sans text-[11px] text-text-faint">A short public bio</span>
            </div>
            {isEditing ? (
              <textarea
                name="bio"
                value={editForm.bio || ''}
                onChange={handleInputChange}
                rows={5}
                placeholder="Tell brands who you are…"
                className="w-full bg-surface-sunk border border-line rounded-xl px-4 py-3 font-sans text-[14px] leading-relaxed text-text placeholder:text-text-mute focus:outline-none focus:border-iris focus:shadow-ring transition resize-none"
              />
            ) : (
              <p className="font-sans text-[14.5px] leading-relaxed text-text-soft">
                {profile.bio || <span className="text-text-faint italic">No bio provided yet.</span>}
              </p>
            )}
          </section>

          {/* Platforms / syndication */}
          <section className="surface p-6 animate-rise-in" style={{ animationDelay: '130ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-[16px] font-semibold text-text">Connected platforms</h3>
                <p className="font-sans text-[12px] text-text-mute mt-0.5">
                  Link the channels you publish on.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {platformItems.map((p) => {
                const active = !!editForm.platforms?.[p.key];
                const Icon = p.icon;
                return (
                  <button
                    type="button"
                    key={p.key}
                    onClick={() => isEditing && handlePlatformChange(p.key)}
                    disabled={!isEditing}
                    className={cn(
                      'relative flex items-center gap-3 p-4 rounded-2xl border transition-all text-left',
                      active
                        ? 'bg-iris-soft border-iris/40 shadow-[0_0_0_3px_rgba(155,140,255,0.10)]'
                        : 'bg-surface-sunk border-line',
                      isEditing
                        ? 'cursor-pointer hover:border-line-strong hover:bg-surface-soft'
                        : 'cursor-default'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl grid place-items-center shrink-0 border',
                        active ? 'bg-[#0d0f13] border-white/10' : 'bg-surface-soft border-line'
                      )}
                      style={{ color: active ? p.color : '#8a8d97' }}
                    >
                      <Icon size={18} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'font-sans text-[13.5px] font-semibold',
                        active ? 'text-text' : 'text-text-soft'
                      )}>
                        {p.label}
                      </div>
                      <div className="font-sans text-[11.5px] text-text-mute">
                        {active ? 'Connected' : 'Not linked'}
                      </div>
                    </div>
                    {active && (
                      <CheckCircle2 size={16} className="text-iris" strokeWidth={2} />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="flex flex-col gap-5">
          {/* Contact */}
          <section className="surface p-6 animate-rise-in" style={{ animationDelay: '180ms' }}>
            <h3 className="font-display text-[16px] font-semibold text-text mb-4">Contact</h3>

            <div className="flex flex-col gap-4">
              <Field
                icon={<Mail size={13} strokeWidth={2} />}
                label="Email"
                editing={isEditing}
                value={editForm.email}
                name="email"
                onChange={handleInputChange}
                type="email"
                display={profile.email}
              />
              <Field
                icon={<MapPin size={13} strokeWidth={2} />}
                label="Location"
                editing={isEditing}
                value={editForm.location}
                name="location"
                onChange={handleInputChange}
                display={profile.location || '—'}
                placeholder="City"
              />
            </div>
          </section>

          {/* Promo card */}
          <section className="rounded-2xl bg-iris-grad p-5 text-white relative overflow-hidden animate-rise-in" style={{ animationDelay: '230ms' }}>
            <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-4 -bottom-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-90">
                <Sparkles size={12} strokeWidth={2.25} /> Imbass Pro
              </div>
              <h4 className="font-display text-[17px] font-semibold leading-tight">
                Unlock priority placement & analytics.
              </h4>
              <p className="font-sans text-[12.5px] mt-2 opacity-85 leading-relaxed">
                Featured roster, advanced insights, and first pass on direct invites.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 !bg-white !text-iris-deep !border-transparent hover:!bg-white/90"
              >
                Upgrade
              </Button>
            </div>
          </section>
        </aside>
      </div>

      <div className="h-6" />
    </form>
  );
};

/* Small inline editable field */
const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  editing: boolean;
  value?: string;
  display: string;
  name: string;
  type?: string;
  placeholder?: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}> = ({ icon, label, editing, value, display, name, type, placeholder, onChange }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5 font-sans text-[11px] text-text-mute font-medium">
      <span className="text-text-faint">{icon}</span>
      {label}
    </div>
    {editing ? (
      <Input
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="!h-10 !text-[13.5px]"
      />
    ) : (
      <div className="font-sans text-[14px] text-text">{display}</div>
    )}
  </div>
);

export default ProfilePage;
