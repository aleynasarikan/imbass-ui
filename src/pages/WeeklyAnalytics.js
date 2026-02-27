import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';
import './WeeklyAnalytics.css';

const influencerPerformances = [
    { name: 'Alex Chen', engagement: 85, reach: 120 },
    { name: 'Sarah Jones', engagement: 65, reach: 85 },
    { name: 'Mike Ross', engagement: 95, reach: 210 },
    { name: 'Emma Wilson', engagement: 45, reach: 50 },
    { name: 'Jessica Lee', engagement: 110, reach: 340 }, // Best performing
];

const adPerformances = [
    { name: 'Summer Campaign', clicks: 4500, conversions: 320 }, // Best performing ad
    { name: 'Tech Gadget Launch', clicks: 3200, conversions: 210 },
    { name: 'Fitness App Promo', clicks: 2800, conversions: 190 },
    { name: 'Beauty Brand Collab', clicks: 3900, conversions: 280 },
];

const WeeklyAnalytics = () => {
    // Logic to find best performers
    const bestInfluencer = influencerPerformances.reduce((prev, current) =>
        (prev.engagement + prev.reach > current.engagement + current.reach) ? prev : current
    );

    const bestAd = adPerformances.reduce((prev, current) =>
        (prev.conversions > current.conversions) ? prev : current
    );

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
                            <span>Clicks: {(bestAd.clicks / 1000).toFixed(1)}K</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Influencer Performance (Reach vs Engagement)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={influencerPerformances}
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
                    <h3>Ad Campaign Clicks / Conversions</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={adPerformances}
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
        </div>
    );
};

export default WeeklyAnalytics;
