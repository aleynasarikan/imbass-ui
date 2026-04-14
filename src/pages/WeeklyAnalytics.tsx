import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TrendingUp, Star, Flame, BarChart2 } from 'lucide-react';
import api from '../api';

interface InfluencerMetric {
    name: string;
    engagement: number;
    reach: number;
}

interface AdMetric {
    name: string;
    clicks: number;
    conversions: number;
}

interface AnalyticsData {
    influencers: InfluencerMetric[];
    ads: AdMetric[];
}

const WeeklyAnalytics: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({ influencers: [], ads: [] });
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get<AnalyticsData>('/analytics/weekly');
                setAnalyticsData(res.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent-peach border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted">Loading Analytics...</span>
                </div>
            </div>
        );
    }

    const hasData = analyticsData.influencers?.length > 0 && analyticsData.ads?.length > 0;

    let bestInfluencer: InfluencerMetric = { name: 'N/A', engagement: 0, reach: 0 };
    let bestAd: AdMetric = { name: 'N/A', conversions: 0, clicks: 0 };

    if (hasData) {
        bestInfluencer = analyticsData.influencers.reduce((prev, current) =>
            (prev.engagement + prev.reach > current.engagement + current.reach) ? prev : current
        );
        bestAd = analyticsData.ads.reduce((prev, current) =>
            (prev.conversions > current.conversions) ? prev : current
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-card border border-white/10 rounded-lg px-3 py-2 shadow-card">
                    <p className="text-xs text-muted mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Weekly Analytics</h2>
                <p className="text-sm text-muted">Track performance metrics and campaign conversions.</p>
            </div>

            {hasData ? (
                <>
                    {/* Highlight Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-l-4 border-l-accent-peach">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-accent-peach/10">
                                        <Star size={22} className="text-accent-peach" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted uppercase tracking-wider mb-1">Top Influencer of the Week</p>
                                        <h3 className="text-lg font-bold text-white mb-2">{bestInfluencer.name}</h3>
                                        <div className="flex gap-4">
                                            <div>
                                                <span className="text-xs text-muted">Engagement</span>
                                                <p className="text-sm font-semibold text-accent-peach">{bestInfluencer.engagement}K</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted">Reach</span>
                                                <p className="text-sm font-semibold text-accent-lilac">{bestInfluencer.reach}K</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-accent-salmon">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-accent-salmon/10">
                                        <Flame size={22} className="text-accent-salmon" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted uppercase tracking-wider mb-1">Best Performing Ad</p>
                                        <h3 className="text-lg font-bold text-white mb-2">{bestAd.name}</h3>
                                        <div className="flex gap-4">
                                            <div>
                                                <span className="text-xs text-muted">Conversions</span>
                                                <p className="text-sm font-semibold text-accent-salmon">{bestAd.conversions}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted">Clicks</span>
                                                <p className="text-sm font-semibold text-muted-lighter">{bestAd.clicks}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Influencer Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.influencers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="name" stroke="#8b8ba3" tick={{ fill: '#8b8ba3', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                            <YAxis stroke="#8b8ba3" tick={{ fill: '#8b8ba3', fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <RechartsTooltip content={CustomTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8b8ba3' }} />
                                            <Bar dataKey="reach" name="Reach (K)" fill="#b08bbf" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="engagement" name="Engagement (K)" fill="#e8a87c" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Ad Campaign Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analyticsData.ads} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#e8a87c" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#e8a87c" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#b08bbf" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#b08bbf" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="name" stroke="#8b8ba3" tick={{ fill: '#8b8ba3', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                            <YAxis stroke="#8b8ba3" tick={{ fill: '#8b8ba3', fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <RechartsTooltip content={CustomTooltip} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8b8ba3' }} />
                                            <Area type="monotone" dataKey="clicks" name="Total Clicks" stroke="#e8a87c" fill="url(#clicksGrad)" strokeWidth={2} dot={{ r: 3, fill: '#e8a87c', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                            <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#b08bbf" fill="url(#convGrad)" strokeWidth={2} dot={{ r: 3, fill: '#b08bbf', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <BarChart2 size={48} className="mx-auto text-muted mb-3" />
                        <p className="text-muted-lighter font-medium mb-1">No Data Yet</p>
                        <p className="text-sm text-muted">Insufficient analytical data available to populate dashboards yet.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default WeeklyAnalytics;
