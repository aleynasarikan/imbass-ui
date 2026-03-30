import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Upload, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api';

/* Social Media Icons */
const SocialIcons: Record<string, React.ReactNode> = {
    twitter: <svg viewBox="0 0 24 24" fill="#1DA1F2" className="w-5 h-5"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 002.048-2.578 9.3 9.3 0 01-2.958 1.13 4.66 4.66 0 00-7.938 4.25 13.229 13.229 0 01-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 003.96 9.824a4.647 4.647 0 01-2.11-.583v.06a4.66 4.66 0 003.737 4.568 4.692 4.692 0 01-2.104.08 4.661 4.661 0 004.352 3.234 9.348 9.348 0 01-5.786 1.995 9.5 9.5 0 01-1.112-.065 13.175 13.175 0 007.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.47 9.47 0 002.323-2.41z"/></svg>,
    instagram: <svg viewBox="0 0 24 24" fill="#E4405F" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    tiktok: <svg viewBox="0 0 24 24" fill="#ffffff" className="w-5 h-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
    youtube: <svg viewBox="0 0 24 24" fill="#FF0000" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    twitch: <svg viewBox="0 0 24 24" fill="#9146FF" className="w-5 h-5"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
    other: <svg viewBox="0 0 24 24" fill="#8b8ba3" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
};

const SOCIAL_PLATFORMS = [
    { key: 'twitter', label: 'Twitter / X', placeholder: '@username' },
    { key: 'instagram', label: 'Instagram', placeholder: '@username' },
    { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
    { key: 'youtube', label: 'YouTube', placeholder: 'Channel URL or username' },
    { key: 'twitch', label: 'Twitch', placeholder: 'username' },
    { key: 'other', label: 'Other', placeholder: 'URL or username' },
];

const OnboardingPage: React.FC = () => {
    const { user, completeOnboarding } = useAuth();
    const role = user?.role;
    const totalSteps = 2;

    const [step, setStep] = useState<number>(1);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const [username, setUsername] = useState<string>('');
    const [socialAccounts, setSocialAccounts] = useState<Record<string, string>>(
        SOCIAL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p.key]: '' }), {})
    );
    const [companyName, setCompanyName] = useState<string>('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isStep1Valid = (): boolean => {
        if (role === 'INFLUENCER') return username.trim().length > 0;
        if (role === 'AGENCY') return companyName.trim().length > 0;
        return false;
    };

    const isStep2Valid = (): boolean => {
        if (role === 'INFLUENCER') return Object.values(socialAccounts).some(v => v.trim().length > 0);
        return true;
    };

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            if (role === 'INFLUENCER') {
                const accounts = Object.entries(socialAccounts)
                    .filter(([, val]) => val.trim())
                    .map(([platform, value]) => ({ platform, username: value.trim(), profileUrl: value.trim().startsWith('http') ? value.trim() : "" }));
                await api.post('/onboarding/influencer', { username: username.trim(), socialAccounts: accounts });
            } else {
                await api.post('/onboarding/agency', { companyName: companyName.trim(), logoUrl: logoPreview });
            }
            completeOnboarding();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Onboarding failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoFile = (file: File | null) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e: any) => setLogoPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        handleLogoFile(e.dataTransfer.files[0]);
    };

    const canGoNext = step === 1 ? isStep1Valid() : isStep2Valid();

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-peach/3 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-lilac/3 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-lg relative">
                <CardContent className="p-8">
                    {/* Progress */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        {Array.from({ length: totalSteps }, (_, i) => {
                            const num = i + 1;
                            return (
                                <React.Fragment key={num}>
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                        step > num ? "bg-accent-peach text-dark-500" :
                                        step === num ? "bg-accent-peach/20 text-accent-peach ring-2 ring-accent-peach/30" :
                                        "bg-dark-100 text-muted"
                                    )}>
                                        {step > num ? <Check size={16} /> : num}
                                    </div>
                                    {num < totalSteps && (
                                        <div className={cn("w-16 h-0.5 rounded-full transition-colors", step > num ? "bg-accent-peach" : "bg-dark-100")} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <p className="text-center text-xs text-muted mb-6">Step {step} of {totalSteps}</p>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step Content */}
                    {role === 'INFLUENCER' && step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gradient">Welcome, Creator!</h3>
                                <p className="text-sm text-muted mt-1">What name would you like to go by?</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-lighter">Username</label>
                                <Input
                                    value={username}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                    placeholder="Your display name"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {role === 'INFLUENCER' && step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gradient">Connect Your Socials</h3>
                                <p className="text-sm text-muted mt-1">Add your social media accounts.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                                    <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-dark-100 border border-white/[0.04]">
                                        <div className="flex-shrink-0">{SocialIcons[key]}</div>
                                        <Input
                                            value={socialAccounts[key]}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSocialAccounts(prev => ({ ...prev, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            title={label}
                                            className="border-0 bg-transparent focus-visible:ring-0 h-8"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {role === 'AGENCY' && step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gradient">Welcome, Partner!</h3>
                                <p className="text-sm text-muted mt-1">Tell us about your company.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-lighter">Company Name</label>
                                <Input
                                    value={companyName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                                    placeholder="Acme Marketing Inc."
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {role === 'AGENCY' && step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gradient">Brand Identity</h3>
                                <p className="text-sm text-muted mt-1">Upload your logo <span className="text-xs text-muted">(optional)</span></p>
                            </div>
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                                    dragOver ? "border-accent-peach bg-accent-peach/5" : "border-white/10 hover:border-white/20"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleLogoFile(e.target.files?.[0] || null)}
                                />
                                {!logoPreview ? (
                                    <>
                                        <Upload size={32} className="mx-auto text-muted mb-3" />
                                        <p className="text-sm text-muted-lighter">Click or drag & drop logo here</p>
                                        <p className="text-xs text-muted mt-1">PNG, JPG up to 2MB</p>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <img src={logoPreview} alt="Logo" className="w-20 h-20 mx-auto rounded-lg object-cover" />
                                        <Button type="button" variant="ghost" size="sm"
                                            onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }}>
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 gap-3">
                        {step > 1 ? (
                            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                        ) : <div />}

                        {step < totalSteps ? (
                            <Button disabled={!canGoNext} onClick={() => setStep(step + 1)}>Next</Button>
                        ) : (
                            <Button disabled={!canGoNext || loading} onClick={handleSubmit}>
                                {loading ? 'Saving...' : 'Complete Setup'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingPage;
