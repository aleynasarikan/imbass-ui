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

interface Campaign {
    id: string;
    name: string;
    assignedTo: string;
    week: string;
    status: string;
}

const AdCollaboration: React.FC = () => {
    const [ads, setAds] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
    const [selectedAdId, setSelectedAdId] = useState<string | null>(null);

    const [newAdName, setNewAdName] = useState<string>('');
    const [newAdWeek, setNewAdWeek] = useState<string>('');
    const [applyInfluencerName, setApplyInfluencerName] = useState<string>('');

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get<Campaign[]>('/campaigns');
                setAds(res.data);
            } catch (err) {
                console.error("Error fetching campaigns", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    const handleCreateAd = async (e: FormEvent) => {
        e.preventDefault();
        if (newAdName && newAdWeek) {
            const newAd: Campaign = {
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

    const openApplyModal = (adId: string) => {
        setSelectedAdId(adId);
        setApplyInfluencerName('');
        setIsApplyModalOpen(true);
    };

    const handleApplyForAd = async (e: FormEvent) => {
        e.preventDefault();
        if (applyInfluencerName && selectedAdId) {
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
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 w-full sm:w-auto">
                    <Plus size={16} /> Create Ad
                </Button>
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
                                                <Button variant="ghost" size="sm" onClick={() => openApplyModal(ad.id)} className="text-accent-peach hover:text-accent-peach gap-1">
                                                    <ExternalLink size={13} /> Apply
                                                </Button>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Week</label>
                            <Input
                                placeholder="e.g., Week 26"
                                value={newAdWeek}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAdWeek(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Apply Dialog */}
            <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply for Ad</DialogTitle>
                        <DialogDescription>Enter your name to apply for this ad campaign.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleApplyForAd} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Your Name (Influencer)</label>
                            <Input
                                placeholder="Enter your name"
                                value={applyInfluencerName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setApplyInfluencerName(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Submit Application</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdCollaboration;
