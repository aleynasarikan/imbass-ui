import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import api from '../api';

const Dashboard = () => {
    const [influencers, setInfluencers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    const platforms = ['All', 'YouTube', 'Instagram', 'TikTok'];

    useEffect(() => {
        const fetchInfluencers = async () => {
            try {
                const res = await api.get('/influencers'); // Uses standard token via interceptor
                setInfluencers(res.data);
            } catch (err) {
                console.error("Failed to fetch influencers", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInfluencers();
    }, []);

    const filteredInfluencers = influencers.filter(inf => {
        const matchesSearch = inf.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'All' || inf.platform.toLowerCase() === platformFilter.toLowerCase();
        return matchesSearch && matchesPlatform;
    });

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Influencers...</div>;

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
                                {inf.name.charAt(0).toUpperCase()}
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
