import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import api from '../api';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Profile from DB over Protected Route
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profile/me');
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm({
            ...editForm,
            [name]: value
        });
    };

    const handlePlatformChange = (platform) => {
        setEditForm({
            ...editForm,
            platforms: {
                ...editForm.platforms,
                [platform]: !editForm.platforms[platform]
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('/profile/me', editForm);
            setProfile(editForm);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Error saving profile");
        }
    };

    const handleCancel = () => {
        setEditForm(profile);
        setIsEditing(false);
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Profile...</div>;
    if (!profile) return <div style={{ padding: '50px', textAlign: 'center' }}>Could not load profile. Ensure you are logged in.</div>;

    return (
        <div className="profile-container">
            <div className="profile-header-banner">
                <div className="profile-avatar-large">
                    <div className="avatar-placeholder">
                        {profile.name.charAt(0)}
                    </div>
                    {isEditing && (
                        <button className="change-avatar-btn">
                            <span>📷</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="profile-content-wrapper">
                <div className="profile-main">
                    <div className="profile-details-header">
                        <div className="name-and-role">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name || ''}
                                    onChange={handleInputChange}
                                    className="edit-input name-input"
                                />
                            ) : (
                                <h2>{profile.name}</h2>
                            )}

                            <span className="role-badge">{profile.role}</span>
                        </div>

                        {!isEditing && (
                            <button
                                className="edit-profile-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <form className="profile-info-grid" onSubmit={handleSave}>
                        <div className="info-card bio-section">
                            <h3>Bio</h3>
                            {isEditing ? (
                                <textarea
                                    name="bio"
                                    value={editForm.bio || ''}
                                    onChange={handleInputChange}
                                    className="edit-textarea"
                                    rows="4"
                                />
                            ) : (
                                <p>{profile.bio || 'No bio provided.'}</p>
                            )}
                        </div>

                        <div className="info-card contact-section">
                            <h3>Contact Information</h3>
                            <div className="info-row">
                                <span className="info-label">Email:</span>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={editForm.email || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <span className="info-value">{profile.email || profile.contactEmail}</span>
                                )}
                            </div>
                            <div className="info-row">
                                <span className="info-label">Location:</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="location"
                                        value={editForm.location || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <span className="info-value">{profile.location || 'Location not set'}</span>
                                )}
                            </div>
                        </div>

                        <div className="info-card platforms-section">
                            <h3>Platforms</h3>
                            {isEditing ? (
                                <div className="platform-toggles">
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={editForm.platforms?.youtube}
                                            onChange={() => handlePlatformChange('youtube')}
                                        />
                                        <span className="checkmark"></span>
                                        YouTube
                                    </label>
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={editForm.platforms?.instagram}
                                            onChange={() => handlePlatformChange('instagram')}
                                        />
                                        <span className="checkmark"></span>
                                        Instagram
                                    </label>
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={editForm.platforms?.tiktok}
                                            onChange={() => handlePlatformChange('tiktok')}
                                        />
                                        <span className="checkmark"></span>
                                        TikTok
                                    </label>
                                </div>
                            ) : (
                                <div className="active-platforms">
                                    {profile.platforms?.youtube && <span className="platform-tag youtube">YouTube</span>}
                                    {profile.platforms?.instagram && <span className="platform-tag instagram">Instagram</span>}
                                    {profile.platforms?.tiktok && <span className="platform-tag tiktok">TikTok</span>}
                                    {!profile.platforms?.youtube && !profile.platforms?.instagram && !profile.platforms?.tiktok && (
                                        <span className="no-platforms">No platforms linked</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className="edit-actions">
                                <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                                <button type="submit" className="save-btn">Save Changes</button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
