import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/Dialog';
import { Plus, ExternalLink } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

interface Campaign {
    id: string;
    name: string;
    assignedTo: string;
    week: string;
    status: string;
}

const AdCollaboration: React.FC = () => {
    const { user } = useAuth();
    const [ads, setAds] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
    const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [newAdName, setNewAdName] = useState<string>('');
    // Removing applyInfluencerName as the backend uses the token to identify the user
    const [submitting, setSubmitting] = useState<boolean>(false);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await api.get<Campaign[]>('/campaigns');
            setAds(res.data);
        } catch (err) {
            console.error("Error fetching campaigns", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleCreateAd = async (e: FormEvent) => {
        e.preventDefault();
        if (newAdName) {
            setSubmitting(true);
            setError(null);
            try {
                await api.post('/campaigns', { title: newAdName });
                setNewAdName('');
                setIsCreateModalOpen(false);
                fetchCampaigns(); // Refresh the list
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to create campaign');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const openApplyModal = (adId: string) => {
        setSelectedAdId(adId);
        setError(null);
        setIsApplyModalOpen(true);
    };

    const handleApplyForAd = async (e: FormEvent) => {
        e.preventDefault();
        if (selectedAdId) {
            setSubmitting(true);
            setError(null);
            try {
                await api.post(`/campaigns/${selectedAdId}/apply`);
                setIsApplyModalOpen(false);
                setSelectedAdId(null);
                fetchCampaigns(); // Refresh
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to apply for campaign');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'OPEN': return 'success' as const;
            case 'ASSIGNED': return 'default' as const;
            case 'IN_REVIEW': return 'warning' as const;
            case 'COMPLETED': return 'lilac' as const;
            default: return 'secondary' as const;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent-peach border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted">Loading Campaigns...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Ad Collaboration</h2>
                    <p className="text-sm text-muted">Manage and assign ad campaigns to influencers.</p>
                </div>
                {user?.role !== 'INFLUENCER' && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 w-full sm:w-auto">
                        <Plus size={16} /> Create Ad
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider px-5 py-3">Ad Name</th>
                                    <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider px-5 py-3">Assigned To</th>
                                    <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider px-5 py-3">Week</th>
                                    <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider px-5 py-3">Status</th>
                                    <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ads.map((ad) => (
                                    <tr key={ad.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5 text-sm font-medium text-white">{ad.name}</td>
                                        <td className="px-5 py-3.5 text-sm">
                                            <span className={ad.assignedTo === 'Unassigned' ? 'text-muted italic' : 'text-muted-lighter'}>
                                                {ad.assignedTo}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-muted-lighter">{ad.week}</td>
                                        <td className="px-5 py-3.5">
                                            <Badge variant={getStatusVariant(ad.status)}>
                                                {ad.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {ad.status === 'OPEN' ? (
                                                user?.role === 'INFLUENCER' ? (
                                                    <Button variant="ghost" size="sm" onClick={() => openApplyModal(ad.id)} className="text-accent-peach hover:text-accent-peach gap-1">
                                                        <ExternalLink size={13} /> Apply
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted">Waiting Application</span>
                                                )
                                            ) : (
                                                <span className="text-xs text-muted">Closed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {ads.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-muted">
                                            No campaigns yet. Create your first ad campaign!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Ad Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Ad</DialogTitle>
                        <DialogDescription>Fill in the details for your new ad campaign.</DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleCreateAd} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Ad Name</label>
                            <Input
                                placeholder="e.g., Summer Promo"
                                value={newAdName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAdName(e.target.value)}
                                required
                            />
                        </div>
                        {/* We removed Ad Week as date is generated correctly by DB */}
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitting}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Apply Dialog */}
            <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply for Ad</DialogTitle>
                        <DialogDescription>Are you sure you want to apply for this campaign? Your profile will be submitted to the agency for review.</DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleApplyForAd} className="space-y-4">
                        <DialogFooter className="gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)} disabled={submitting}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Applying...' : 'Submit Application'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdCollaboration;
