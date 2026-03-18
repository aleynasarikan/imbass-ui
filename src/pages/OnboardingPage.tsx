import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './OnboardingPage.css';

/* ─── Social Media SVG Icons ─── */
const SocialIcons: Record<string, React.ReactNode> = {
    twitter: (
        <svg viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 002.048-2.578 9.3 9.3 0 01-2.958 1.13 4.66 4.66 0 00-7.938 4.25 13.229 13.229 0 01-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 003.96 9.824a4.647 4.647 0 01-2.11-.583v.06a4.66 4.66 0 003.737 4.568 4.692 4.692 0 01-2.104.08 4.661 4.661 0 004.352 3.234 9.348 9.348 0 01-5.786 1.995 9.5 9.5 0 01-1.112-.065 13.175 13.175 0 007.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.47 9.47 0 002.323-2.41l.002-.003z"/></svg>
    ),
    instagram: (
        <svg viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    ),
    tiktok: (
        <svg viewBox="0 0 24 24" fill="#ffffff"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    ),
    youtube: (
        <svg viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ),
    twitch: (
        <svg viewBox="0 0 24 24" fill="#9146FF"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
    ),
    steam: (
        <svg viewBox="0 0 24 24" fill="#1B2838"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>
    ),
    other: (
        <svg viewBox="0 0 24 24" fill="#adb5bd"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
    ),
};

const SOCIAL_PLATFORMS = [
    { key: 'twitter', label: 'Twitter / X', placeholder: '@username' },
    { key: 'instagram', label: 'Instagram', placeholder: '@username' },
    { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
    { key: 'youtube', label: 'YouTube', placeholder: 'Channel URL or username' },
    { key: 'twitch', label: 'Twitch', placeholder: 'username' },
    { key: 'steam', label: 'Steam', placeholder: 'Profile URL or username' },
    { key: 'other', label: 'Other', placeholder: 'URL or username' },
];

const OnboardingPage: React.FC = () => {
    const { user, completeOnboarding } = useAuth();
    const role = user?.role;
    const totalSteps = 2;

    const [step, setStep] = useState<number>(1);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Influencer state
    const [username, setUsername] = useState<string>('');
    const [socialAccounts, setSocialAccounts] = useState<Record<string, string>>(
        SOCIAL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p.key]: '' }), {})
    );

    // Agency state
    const [companyName, setCompanyName] = useState<string>('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ─── Validation ─── */
    const isStep1Valid = (): boolean => {
        if (role === 'INFLUENCER') return username.trim().length > 0;
        if (role === 'AGENCY') return companyName.trim().length > 0;
        return false;
    };

    const isStep2Valid = (): boolean => {
        if (role === 'INFLUENCER') {
            // At least one social account filled
            return Object.values(socialAccounts).some(v => v.trim().length > 0);
        }
        // Agency step 2 (logo) is optional
        return true;
    };

    /* ─── Submit ─── */
    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            if (role === 'INFLUENCER') {
                const accounts = Object.entries(socialAccounts)
                    .filter(([, val]) => val.trim())
                    .map(([platform, value]) => ({
                        platform,
                        username: value.trim(),
                        profileUrl: value.trim().startsWith('http') ? value.trim() : null,
                    }));

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

    /* ─── Logo Upload Handlers ─── */
    const handleLogoFile = (file: File | null) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e: any) => setLogoPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleLogoFile(file);
    };

    /* ─── Progress Bar ─── */
    const renderProgress = () => (
        <div className="progress-bar-container">
            <div className="progress-steps">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const num = i + 1;
                    return (
                        <div className="progress-step" key={num}>
                            <div className={`step-circle ${step === num ? 'active' : step > num ? 'completed' : ''}`}>
                                {step > num ? '✓' : num}
                            </div>
                            {num < totalSteps && <div className={`step-line ${step > num ? 'active' : ''}`} />}
                        </div>
                    );
                })}
            </div>
            <div className="progress-label">Step {step} of {totalSteps}</div>
        </div>
    );

    /* ─── Influencer Steps ─── */
    const renderInfluencerStep1 = () => (
        <div className="step-content" key="inf-1">
            <h3 className="text-gradient">Welcome, Creator!</h3>
            <p>Let's set up your profile. What name would you like to go by?</p>
            <div className="onboarding-field">
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    placeholder="Your display name"
                    autoFocus
                />
            </div>
        </div>
    );

    const renderInfluencerStep2 = () => (
        <div className="step-content" key="inf-2">
            <h3 className="text-gradient">Connect Your Socials</h3>
            <p>Add your social media accounts so brands can find you.</p>
            <div className="social-grid">
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                    <div className="social-item" key={key}>
                        <div className="social-icon">{SocialIcons[key]}</div>
                        <input
                            type="text"
                            value={socialAccounts[key]}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSocialAccounts(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder={placeholder}
                            title={label}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    /* ─── Agency Steps ─── */
    const renderAgencyStep1 = () => (
        <div className="step-content" key="ag-1">
            <h3 className="text-gradient">Welcome, Partner!</h3>
            <p>Tell us about your company or yourself.</p>
            <div className="onboarding-field">
                <label>Company Name or Your Name</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                    placeholder="Acme Marketing Inc."
                    autoFocus
                />
            </div>
        </div>
    );

    const renderAgencyStep2 = () => (
        <div className="step-content" key="ag-2">
            <h3 className="text-gradient">Brand Identity</h3>
            <p>Upload your logo <span className="optional-tag">(optional)</span></p>
            <div
                className={`logo-upload-area ${dragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleLogoFile(e.target.files ? e.target.files[0] : null)}
                />
                {!logoPreview ? (
                    <>
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">Click or drag & drop your logo here</div>
                        <div className="upload-hint">PNG, JPG up to 2MB</div>
                    </>
                ) : (
                    <div className="logo-preview">
                        <img src={logoPreview} alt="Logo preview" />
                        <button
                            type="button"
                            className="logo-remove-btn"
                            onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }}
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    /* ─── Step Renderer ─── */
    const renderStepContent = () => {
        if (role === 'INFLUENCER') {
            return step === 1 ? renderInfluencerStep1() : renderInfluencerStep2();
        }
        return step === 1 ? renderAgencyStep1() : renderAgencyStep2();
    };

    /* ─── Navigation ─── */
    const canGoNext = step === 1 ? isStep1Valid() : isStep2Valid();

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                {renderProgress()}

                {error && <div className="onboarding-error">{error}</div>}

                {renderStepContent()}

                <div className="step-navigation">
                    {step > 1 && (
                        <button className="btn-back" onClick={() => setStep(step - 1)}>
                            Back
                        </button>
                    )}

                    {step < totalSteps ? (
                        <button
                            className="btn-next"
                            disabled={!canGoNext}
                            onClick={() => setStep(step + 1)}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            className="btn-submit"
                            disabled={!canGoNext || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? 'Saving...' : 'Complete Setup'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
