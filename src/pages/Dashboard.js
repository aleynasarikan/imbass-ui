import React, { useState } from 'react';
import './Dashboard.css';

const INITIAL_INFLUENCERS = [
    { id: 1, name: 'Alex Chen', platform: 'YouTube', status: 'active', followers: '1.2M' },
    { id: 2, name: 'Sarah Jones', platform: 'Instagram', status: 'active', followers: '850K' },
    { id: 3, name: 'Mike Ross', platform: 'TikTok', status: 'inactive', followers: '2.1M' },
    { id: 4, name: 'Emma Wilson', platform: 'YouTube', status: 'active', followers: '500K' },
    { id: 5, name: 'David Kim', platform: 'Instagram', status: 'inactive', followers: '120K' },
    { id: 6, name: 'Jessica Lee', platform: 'TikTok', status: 'active', followers: '3.4M' },
];

const Dashboard = () => {
    const [influencers, setInfluencers] = useState(INITIAL_INFLUENCERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState('All');

    const platforms = ['All', 'YouTube', 'Instagram', 'TikTok'];

    const filteredInfluencers = influencers.filter(inf => {
        const matchesSearch = inf.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'All' || inf.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Influencer Management</h2>
                <div className="dashboard-controls">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search influencers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-box">
                        <select
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="platform-select"
                        >
                            {platforms.map(platform => (
                                <option key={platform} value={platform}>{platform}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="influencer-grid">
                {filteredInfluencers.length > 0 ? (
                    filteredInfluencers.map(inf => (
                        <div key={inf.id} className="influencer-card">
                            <div className="influencer-avatar">
                                {inf.name.charAt(0)}
                            </div>
                            <div className="influencer-info">
                                <h3>{inf.name}</h3>
                                <div className="influencer-meta">
                                    <span className={`platform-badge ${inf.platform.toLowerCase()}`}>
                                        {inf.platform}
                                    </span>
                                    <span className="followers-count">👥 {inf.followers}</span>
                                </div>
                            </div>
                            <div className="influencer-status">
                                <span className={`status-indicator ${inf.status}`}></span>
                                <span className="status-text">{inf.status}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <p>No influencers found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
