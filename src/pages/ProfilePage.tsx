import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Camera, MapPin, Mail, Edit3, Save, X } from 'lucide-react';
import api from '../api';

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
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get<ProfileData>('/profile/me');
                setProfile(res.data);
                setEditForm(res.data);
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (editForm) {
            setEditForm({ ...editForm, [name]: value });
        }
    };

    const handlePlatformChange = (platform: keyof NonNullable<ProfileData['platforms']>) => {
        if (editForm) {
            setEditForm({
                ...editForm,
                platforms: { ...editForm.platforms, [platform]: !editForm.platforms?.[platform] }
            });
        }
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!editForm) return;
        try {
            await api.put('/profile/me', editForm);
            setProfile(editForm);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    const handleCancel = () => {
        setEditForm(profile);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent-peach border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted">Loading Profile...</span>
                </div>
            </div>
        );
    }

    if (!profile || !editForm) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted">Could not load profile. Ensure you are logged in.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Profile Header */}
            <div className="relative">
                <div className="h-32 md:h-40 rounded-2xl bg-gradient-to-br from-accent-peach/20 via-accent-salmon/10 to-accent-lilac/20 border border-white/[0.06]" />
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 px-6 -mt-10">
                    <div className="relative">
                        <Avatar className="h-20 w-20 ring-4 ring-dark border-2 border-accent-peach/30">
                            <AvatarFallback className="text-2xl bg-accent-peach/20 text-accent-peach">
                                {profile.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-dark-card border border-white/10 text-muted hover:text-white transition-colors">
                                <Camera size={12} />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pb-2">
                        <div>
                            {isEditing ? (
                                <Input
                                    name="name"
                                    value={editForm.name || ''}
                                    onChange={handleInputChange}
                                    className="text-lg font-bold mb-1 w-64"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                            )}
                            <Badge variant="default" className="mt-1">{profile.role}</Badge>
                        </div>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 mt-3 sm:mt-0">
                                <Edit3 size={14} /> Edit Profile
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                {/* Bio */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Bio</h3>
                        {isEditing ? (
                            <textarea
                                name="bio"
                                value={editForm.bio || ''}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-peach/30 resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        ) : (
                            <p className="text-sm text-muted-lighter leading-relaxed">{profile.bio || 'No bio provided.'}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-muted flex-shrink-0" />
                                {isEditing ? (
                                    <Input name="email" type="email" value={editForm.email || ''} onChange={handleInputChange} className="flex-1" />
                                ) : (
                                    <span className="text-sm text-muted-lighter">{profile.email || profile.contactEmail}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className="text-muted flex-shrink-0" />
                                {isEditing ? (
                                    <Input name="location" value={editForm.location || ''} onChange={handleInputChange} placeholder="Your location" className="flex-1" />
                                ) : (
                                    <span className="text-sm text-muted-lighter">{profile.location || 'Location not set'}</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Platforms */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Platforms</h3>
                        {isEditing ? (
                            <div className="flex flex-wrap gap-3">
                                {(['youtube', 'instagram', 'tiktok'] as const).map((platform) => (
                                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.platforms?.[platform] || false}
                                            onChange={() => handlePlatformChange(platform)}
                                            className="w-4 h-4 rounded border-white/20 bg-dark-100 text-accent-peach focus:ring-accent-peach/30"
                                        />
                                        <span className="text-sm text-muted-lighter capitalize">{platform}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.platforms?.youtube && <Badge variant="danger">YouTube</Badge>}
                                {profile.platforms?.instagram && <Badge variant="salmon">Instagram</Badge>}
                                {profile.platforms?.tiktok && <Badge variant="default">TikTok</Badge>}
                                {!profile.platforms?.youtube && !profile.platforms?.instagram && !profile.platforms?.tiktok && (
                                    <span className="text-sm text-muted">No platforms linked</span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Actions */}
                {isEditing && (
                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
                            <X size={14} /> Cancel
                        </Button>
                        <Button type="submit" className="gap-2">
                            <Save size={14} /> Save Changes
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ProfilePage;
