import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';
import './WeeklyAnalytics.css';
import api from '../api';

const WeeklyAnalytics = () => {
    const [analyticsData, setAnalyticsData] = useState({ influencers: [], ads: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics/weekly');
                setAnalyticsData(res.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Analytics...</div>;

    // Protection from empty states
    const hasData = analyticsData.influencers?.length > 0 && analyticsData.ads?.length > 0;

    // Logic to find best performers dynamically
    let bestInfluencer = { name: 'N/A', engagement: 0, reach: 0 };
    let bestAd = { name: 'N/A', conversions: 0, clicks: 0 };

    if (hasData) {
        bestInfluencer = analyticsData.influencers.reduce((prev, current) =>
            (prev.engagement + prev.reach > current.engagement + current.reach) ? prev : current
        );

        bestAd = analyticsData.ads.reduce((prev, current) =>
            (prev.conversions > current.conversions) ? prev : current
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <div className="header-titles">
                    <h2>Weekly Analytics</h2>
                    <p>Track performance metrics and campaign conversions.</p>
                </div>
            </div>

            {hasData ? (
                <>
                    <div className="highlights-grid">
                        <div className="highlight-card influencer-highlight">
                            <div className="highlight-icon">⭐</div>
                            <div className="highlight-info">
                                <h4>Top Influencer of the Week</h4>
                                <h3>{bestInfluencer.name}</h3>
                                <div className="highlight-stats">
                                    <span>Engagement: {bestInfluencer.engagement}K</span>
                                    <span>Reach: {bestInfluencer.reach}K</span>
                                </div>
                            </div>
                        </div>

                        <div className="highlight-card ad-highlight">
                            <div className="highlight-icon">🔥</div>
                            <div className="highlight-info">
                                <h4>Best Performing Ad</h4>
                                <h3>{bestAd.name}</h3>
                                <div className="highlight-stats">
                                    <span>Conversions: {bestAd.conversions}</span>
                                    <span>Clicks: {bestAd.clicks}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Influencer Performance (Reach vs. Engagement)</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analyticsData.influencers}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#adb5bd" tick={{ fill: '#adb5bd' }} />
                                        <YAxis stroke="#adb5bd" tick={{ fill: '#adb5bd' }} />
                                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="reach" name="Reach (K)" fill="#9D4EDD" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="engagement" name="Engagement (K)" fill="#00B4D8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3>Ad Campaign Clicks vs Conversions</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={analyticsData.ads}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#adb5bd" tick={{ fill: '#adb5bd' }} />
                                        <YAxis stroke="#adb5bd" tick={{ fill: '#adb5bd' }} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" />
                                        <Line type="monotone" dataKey="clicks" name="Total Clicks" stroke="#00B4D8" strokeWidth={3} dot={{ r: 4, fill: '#00B4D8', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#E0E1DD" strokeWidth={3} dot={{ r: 4, fill: '#E0E1DD', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="no-data-msg" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
                    <p>Insufficient analytical data available to populate dashboards yet.</p>
                </div>
            )}
        </div>
    );
};

export default WeeklyAnalytics;
