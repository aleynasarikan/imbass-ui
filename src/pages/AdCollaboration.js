import React, { useState } from 'react';
import './AdCollaboration.css';

const INITIAL_ADS = [
    { id: 1, name: 'Summer Campaign', assignedTo: 'Unassigned', week: 'Week 24', status: 'Open' },
    { id: 2, name: 'Tech Gadget Launch', assignedTo: 'Alex Chen', week: 'Week 25', status: 'Assigned' },
    { id: 3, name: 'Fitness App Promo', assignedTo: 'Jessica Lee', week: 'Week 25', status: 'In Progress' },
    { id: 4, name: 'Beauty Brand Collab', assignedTo: 'Unassigned', week: 'Week 26', status: 'Open' },
];

const AdCollaboration = () => {
    const [ads, setAds] = useState(INITIAL_ADS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedAdId, setSelectedAdId] = useState(null);

    // Form states
    const [newAdName, setNewAdName] = useState('');
    const [newAdWeek, setNewAdWeek] = useState('');
    const [applyInfluencerName, setApplyInfluencerName] = useState('');

    const handleCreateAd = (e) => {
        e.preventDefault();
        if (newAdName && newAdWeek) {
            const newAd = {
                id: ads.length + 1,
                name: newAdName,
                assignedTo: 'Unassigned',
                week: newAdWeek,
                status: 'Open'
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

    const handleApplyForAd = (e) => {
        e.preventDefault();
        if (applyInfluencerName && selectedAdId) {
            setAds(ads.map(ad => {
                if (ad.id === selectedAdId) {
                    return { ...ad, assignedTo: applyInfluencerName, status: 'Assigned' };
                }
                return ad;
            }));
            setIsApplyModalOpen(false);
            setSelectedAdId(null);
        }
    };

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
                                    <span className={`status-pill ${ad.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                        {ad.status}
                                    </span>
                                </td>
                                <td>
                                    {ad.status === 'Open' ? (
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
