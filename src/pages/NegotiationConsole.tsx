import React, { useState, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import api from '../api';

interface Negotiation {
  id: string;
  campaign_id: string;
  campaign_name: string;
  creator_id: string;
  agency_id: string;
  influencer_name?: string;
  agency_name?: string;
  current_offer_cents: string;
  status: string;
  created_at: string;
}

const NegotiationConsole: React.FC = () => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerInput, setOfferInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const res = await api.get<Negotiation[]>('/negotiations');
      setNegotiations(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load negotiations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleMakeOffer = async (e: FormEvent, campaignId: string) => {
    e.preventDefault();
    const amountStr = offerInput[campaignId];
    if (!amountStr) return;

    // Normally we should find the correct negotiation. Actually the route is `/:campaignId/offer`
    try {
      await api.post(`/negotiations/${campaignId}/offer`, { offerAmount: parseInt(amountStr) * 100 });
      fetchNegotiations();
      setOfferInput({ ...offerInput, [campaignId]: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to make offer');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await api.put(`/negotiations/${id}/accept`);
      fetchNegotiations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept offer');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/negotiations/${id}/reject`);
      fetchNegotiations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject offer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-peach border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Financial Console</h2>
        <p className="text-sm text-muted">Manage your offers, bids, and campaign financials.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {negotiations.length === 0 ? (
          <Card className="bg-dark-card border-none text-center py-8">
            <CardContent>
              <p className="text-muted">No active negotiations found.</p>
            </CardContent>
          </Card>
        ) : (
          negotiations.map(neg => (
            <Card key={neg.id} className="bg-dark-card border border-white/5">
              <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white mb-1">{neg.campaign_name}</h3>
                  <p className="text-sm text-muted">Partner: <span className="text-white">{user?.role === 'INFLUENCER' ? neg.agency_name : neg.influencer_name}</span></p>
                  <p className="text-sm text-muted">Status: <Badge variant={neg.status === 'ACCEPTED' ? 'success' : neg.status === 'REJECTED' ? 'danger' : 'warning'}>{neg.status}</Badge></p>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className="text-right">
                    <p className="text-xs text-muted">Current Offer</p>
                    <p className="text-xl font-bold text-accent-peach">
                      {neg.current_offer_cents ? `${(parseInt(neg.current_offer_cents) / 100).toFixed(2)} TL` : 'No Offer Yet'}
                    </p>
                  </div>

                  {neg.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleAccept(neg.id)} size="sm" className="bg-success hover:bg-success/80 text-white border-0">Accept</Button>
                      <Button onClick={() => handleReject(neg.id)} size="sm" variant="outline" className="text-danger hover:text-danger hover:bg-danger/10 border-danger/30">Reject</Button>
                    </div>
                  )}

                  {(neg.status === 'PENDING' || neg.status === 'COUNTERED' || neg.status === 'REJECTED' || !neg.current_offer_cents) && (
                    <form onSubmit={(e) => handleMakeOffer(e, neg.campaign_id)} className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Counter $"
                        className="w-24 h-8 text-sm"
                        value={offerInput[neg.campaign_id] || ''}
                        onChange={(e) => setOfferInput({ ...offerInput, [neg.campaign_id]: e.target.value })}
                      />
                      <Button type="submit" size="sm" variant="outline" className="h-8">Bid</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NegotiationConsole;
