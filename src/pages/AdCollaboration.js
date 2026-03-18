import React, { useState, useEffect } from 'react';
import './AdCollaboration.css';
import api from '../api';

const AdCollaboration = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedAdId, setSelectedAdId] = useState(null);

    // Form states
    const [newAdName, setNewAdName] = useState('');
    const [newAdWeek, setNewAdWeek] = useState('');
    const [applyInfluencerName, setApplyInfluencerName] = useState('');

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/campaigns');
                setAds(res.data);
            } catch (err) {
                console.error("Error fetching campaigns", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    const handleCreateAd = async (e) => {
        e.preventDefault();
        if (newAdName && newAdWeek) {
            // Note: In a fully implemented backend, this POSTs to /campaigns
            // For now, mocking optimistically the local state update
            const newAd = {
                id: Math.random().toString(),
                name: newAdName,
                assignedTo: 'Unassigned',
                week: newAdWeek,
                status: 'OPEN'
            };
            setAds([...ads, newAd]);

            setNewAdName('');
            setNewAdWeek('');
            setIsCreateModalOpen(false);
        }
    };

    const openApplyModal = (adId) => {
        setSelectedAdId(adId);
        setApplyInfluencerName('');
        setIsApplyModalOpen(true);
    };

    const handleApplyForAd = async (e) => {
        e.preventDefault();
        if (applyInfluencerName && selectedAdId) {
            // Optimistic mock update - In true API, would POST to /applications
            setAds(ads.map(ad => {
                if (ad.id === selectedAdId) {
                    return { ...ad, assignedTo: applyInfluencerName, status: 'ASSIGNED' };
                }
                return ad;
            }));
            setIsApplyModalOpen(false);
            setSelectedAdId(null);
        }
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Campaigns...</div>;

    return (
        <div className="collaboration-container">
            <div className="collaboration-header">
                <div className="header-titles">
                    <h2>Ad Collaboration</h2>
                    <p>Manage and assign ad campaigns to influencers.</p>
                </div>
                <button
                    className="primary-btn create-btn"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <span>+</span> Create Ad
                </button>
            </div>

            <div className="table-container">
                <table className="collab-table">
                    <thead>
                        <tr>
                            <th>Ad Name</th>
                            <th>Assigned Influencer</th>
                            <th>Week</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ads.map((ad) => (
                            <tr key={ad.id}>
                                <td className="ad-name">{ad.name}</td>
                                <td>
                                    <span className={`assigned-badge ${ad.assignedTo === 'Unassigned' ? 'unassigned' : 'assigned'}`}>
                                        {ad.assignedTo}
                                    </span>
                                </td>
                                <td>{ad.week}</td>
                                <td>
                                    <span className={`status-pill ${ad.status.replace(/_/g, '-').toLowerCase()}`}>
                                        {ad.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>
                                    {ad.status === 'OPEN' ? (
                                        <button
                                            className="apply-btn"
                                            onClick={() => openApplyModal(ad.id)}
                                        >
                                            Apply
                                        </button>
                                    ) : (
                                        <button className="apply-btn disabled" disabled>
                                            Closed
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Ad Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Create New Ad</h3>
                            <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateAd} className="modal-form">
                            <div className="form-group">
                                <label>Ad Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Summer Promo"
                                    value={newAdName}
                                    onChange={(e) => setNewAdName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Week</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Week 26"
                                    value={newAdWeek}
                                    onChange={(e) => setNewAdWeek(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Apply for Ad Modal */}
            {isApplyModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Apply for Ad</h3>
                            <button className="close-btn" onClick={() => setIsApplyModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleApplyForAd} className="modal-form">
                            <div className="form-group">
                                <label>Your Name (Influencer)</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={applyInfluencerName}
                                    onChange={(e) => setApplyInfluencerName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsApplyModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Submit Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdCollaboration;
