import React, { useState } from 'react';
import './ProfilePage.css';

const INITIAL_PROFILE = {
    name: 'Alex Chen',
    role: 'Influencer',
    email: 'alex.chen@example.com',
    bio: 'Lifestyle & tech creator passionate about showcasing innovative products to a dedicated audience.',
    platforms: {
        youtube: true,
        instagram: true,
        tiktok: false
    },
    location: 'Los Angeles, CA'
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(INITIAL_PROFILE);
    const [isEditing, setIsEditing] = useState(false);

    // Temporary state for the edit form
    const [editForm, setEditForm] = useState(INITIAL_PROFILE);

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

    const handleSave = (e) => {
        e.preventDefault();
        setProfile(editForm);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditForm(profile);
        setIsEditing(false);
    };

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
                                    value={editForm.name}
                                    onChange={handleInputChange}
                                    className="edit-input name-input"
                                />
                            ) : (
                                <h2>{profile.name}</h2>
                            )}

                            {isEditing ? (
                                <select
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleInputChange}
                                    className="edit-select role-select"
                                >
                                    <option value="Influencer">Influencer</option>
                                    <option value="Agency">Agency</option>
                                    <option value="Producer">Producer</option>
                                </select>
                            ) : (
                                <span className="role-badge">{profile.role}</span>
                            )}
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
                                    value={editForm.bio}
                                    onChange={handleInputChange}
                                    className="edit-textarea"
                                    rows="4"
                                />
                            ) : (
                                <p>{profile.bio}</p>
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
                                        value={editForm.email}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <span className="info-value">{profile.email}</span>
                                )}
                            </div>
                            <div className="info-row">
                                <span className="info-label">Location:</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="location"
                                        value={editForm.location}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <span className="info-value">{profile.location}</span>
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
                                            checked={editForm.platforms.youtube}
                                            onChange={() => handlePlatformChange('youtube')}
                                        />
                                        <span className="checkmark"></span>
                                        YouTube
                                    </label>
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={editForm.platforms.instagram}
                                            onChange={() => handlePlatformChange('instagram')}
                                        />
                                        <span className="checkmark"></span>
                                        Instagram
                                    </label>
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={editForm.platforms.tiktok}
                                            onChange={() => handlePlatformChange('tiktok')}
                                        />
                                        <span className="checkmark"></span>
                                        TikTok
                                    </label>
                                </div>
                            ) : (
                                <div className="active-platforms">
                                    {profile.platforms.youtube && <span className="platform-tag youtube">YouTube</span>}
                                    {profile.platforms.instagram && <span className="platform-tag instagram">Instagram</span>}
                                    {profile.platforms.tiktok && <span className="platform-tag tiktok">TikTok</span>}
                                    {!profile.platforms.youtube && !profile.platforms.instagram && !profile.platforms.tiktok && (
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
