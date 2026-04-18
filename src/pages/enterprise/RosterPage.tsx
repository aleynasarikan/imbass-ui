import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Star, 
  TrendingUp, 
  MessageSquare,
  ClipboardList
} from 'lucide-react';

interface RosterMember {
  creator_id: string;
  full_name: string;
  avatar_url: string | null;
  niche: string;
  trust_score: number;
  xp: number;
  status: string;
  total_reach: string | number;
  total_conversions: string | number;
}

const RosterPage: React.FC = () => {
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('http://localhost:5002/api/agency/roster', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Agency Roster</h1>
          <p className="text-text-muted">Manage your exclusive creators and track their performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-iris text-white rounded-xl font-medium hover:bg-iris-dark transition-colors shadow-lg shadow-iris/20">
            <UserPlus size={18} />
            Invite Creator
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-line shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-iris/10 text-iris grid place-items-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Roster</p>
            <p className="text-xl font-bold text-text">{members.length} Creators</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-surface border border-line shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 grid place-items-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Avg. Trust Score</p>
            <p className="text-xl font-bold text-text">
              {members.length > 0 
                ? Math.round(members.reduce((acc, m) => acc + (m.trust_score || 0), 0) / members.length) 
                : 0}%
            </p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-surface border border-line shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
            <Star size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Top Niche</p>
            <p className="text-xl font-bold text-text">Fashion</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 p-2 rounded-2xl bg-surface border border-line">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text"
            placeholder="Search by name, niche or specialty..."
            className="w-full pl-12 pr-4 py-2 inline-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-surface-alt/50">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Creator</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Niche</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Trust Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Total Reach</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted animate-pulse">
                    Loading your roster...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No creators found in your roster.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.creator_id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-line overflow-hidden border border-line">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-text-muted bg-surface-alt">
                              <Users size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-text text-sm">{member.full_name}</p>
                          <p className="text-xs text-text-muted">Level {Math.floor(Math.sqrt(member.xp / 100))}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-iris/10 text-iris text-xs font-medium">
                        {member.niche}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[60px] h-1.5 rounded-full bg-line overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${member.trust_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-text">{member.trust_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text font-medium">
                        {typeof member.total_reach === 'number' && member.total_reach > 1000000 
                          ? `${(member.total_reach / 1000000).toFixed(1)}M` 
                          : `${Math.round(Number(member.total_reach) / 1000)}k`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text font-medium">{member.total_conversions}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-text-muted hover:text-iris hover:bg-iris/10 rounded-lg transition-colors" title="Add Note">
                          <MessageSquare size={18} />
                        </button>
                        <button className="p-2 text-text-muted hover:text-iris hover:bg-iris/10 rounded-lg transition-colors" title="Tasks">
                          <ClipboardList size={18} />
                        </button>
                        <button className="p-2 text-text-muted hover:bg-surface-alt rounded-lg transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RosterPage;
