import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { Eye, Gift, Code, Clock, CheckCircle, ChevronRight, TrendingUp, MoreHorizontal, Target, Star, Sparkles, BarChart2, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface Influencer {
  id: string;
  name: string;
  platform: string;
  followers: string | number;
}

const avatarColors = ['#e8a87c', '#d4736e', '#c97b84', '#b08bbf', '#7ec8a0', '#6ea8d4', '#e8a87c', '#d4736e'];

const EnterpriseDashboard: React.FC = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [chartFilter, setChartFilter] = useState<string>('All');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [infRes, campRes, sumRes] = await Promise.all([
           api.get<Influencer[]>('/influencers'),
           api.get('/campaigns/dashboard'),
           api.get('/analytics/summary')
        ]);
        setInfluencers(infRes.data);
        setCampaigns(campRes.data);
        setSummary(sumRes.data);
      } catch (err) {
        console.error("Error fetching initial data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchTimeseries = async () => {
      try {
        const res = await api.get(`/analytics/timeseries?filter=${chartFilter}`);
        setTimeseries(res.data);
      } catch (err) {
        console.error("Error fetching timeseries data", err);
      }
    };
    fetchTimeseries();
  }, [chartFilter]);

  const maxValue = timeseries.length > 0 ? Math.max(...timeseries.map(d => d.value)) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-white/10 rounded-lg px-3 py-2 shadow-card">
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className="text-sm font-semibold text-white">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Campaign Type Tabs */}
      <Tabs defaultValue="imbass" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex bg-dark-100 border border-white/[0.06]">
          <TabsTrigger value="imbass" className="gap-2">
            <Target size={16} className="hidden sm:inline" /> Imbass Campaign
          </TabsTrigger>
          <TabsTrigger value="discount" className="gap-2">
            <Gift size={16} className="hidden sm:inline" /> Discount
          </TabsTrigger>
          <TabsTrigger value="influencer" className="gap-2">
            <Star size={16} className="hidden sm:inline" /> Influencer
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Campaigns Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Campaigns</h2>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/30" /> All</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> 4 Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> 5 Paused</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted" /> 3 Draft</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs">All Campaigns</Button>
        </div>

        {/* Campaign Cards - Horizontally scrollable */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {campaigns.map((campaign, i) => (
            <Card
              key={campaign.id}
              className="min-w-[220px] md:min-w-[250px] flex-shrink-0 snap-start"
              style={{ borderLeft: `3px solid ${campaign.color}` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: campaign.color }} />
                    <span className="text-sm font-medium text-white">{campaign.name}</span>
                  </div>
                  <button className="p-1 text-muted hover:text-white transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                <div className="flex gap-6">
                  <div>
                    <div className="text-[11px] text-muted mb-0.5">Remaining</div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-muted" />
                      <span className="text-base font-semibold text-white">{campaign.remaining}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted mb-0.5">Redemptions</div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={13} className="text-muted" />
                      <span className="text-base font-semibold text-white">{campaign.redemptions}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Scroll indicator */}
          <div className="flex items-center px-2 flex-shrink-0">
            <button className="p-2 rounded-full bg-dark-50 text-muted hover:text-white hover:bg-dark-card transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Influencers Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent-peach" />
            <h2 className="text-lg font-semibold text-white">Influencers</h2>
          </div>
          <Button variant="outline" size="sm" className="text-xs">All Influencers</Button>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory">
          {(influencers.length > 0 ? influencers : Array.from({ length: 8 }, (_, i) => ({
            id: String(i),
            name: ['Alex H.', 'Nataly H.', 'Jack M.', 'Erick A.', 'Adam F.', 'Kim H.', 'Anna P.', 'Rita O.'][i],
            platform: 'Instagram',
            followers: '10K'
          }))).map((inf, i) => (
            <div key={inf.id} className="flex flex-col items-center gap-2 snap-start flex-shrink-0">
              <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-dark" style={{ '--tw-ring-color': avatarColors[i % avatarColors.length] } as React.CSSProperties}>
                <AvatarFallback
                  className="text-lg font-bold"
                  style={{ backgroundColor: `${avatarColors[i % avatarColors.length]}30`, color: avatarColors[i % avatarColors.length] }}
                >
                  {inf.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-lighter whitespace-nowrap">{inf.name}</span>
            </div>
          ))}
          <div className="flex items-center px-2 flex-shrink-0">
            <button className="p-2 rounded-full bg-dark-50 text-muted hover:text-white hover:bg-dark-card transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Redemptions Chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-muted" />
            <CardTitle className="text-base">Daily Redemptions</CardTitle>
          </div>
          <div className="flex items-center gap-1 bg-dark-100 rounded-lg p-0.5 border border-white/[0.06]">
            {['24h', '7d', 'All'].map((filter) => (
              <button
                key={filter}
                onClick={() => setChartFilter(filter)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartFilter === filter
                    ? 'bg-dark-card text-white shadow-sm'
                    : 'text-muted hover:text-muted-lighter'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeseries} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8b8ba3"
                  tick={{ fill: '#8b8ba3', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#8b8ba3"
                  tick={{ fill: '#8b8ba3', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {timeseries.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value === maxValue && maxValue > 0 ? '#e8a87c' : 'rgba(255,255,255,0.08)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-dark-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-sm text-muted">Views</p>
                  <Info size={14} className="text-muted cursor-help" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-peach/10">
                    <Eye size={18} className="text-accent-peach" />
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-white">{summary ? summary.views.toLocaleString() : '...'}</span>
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                <TrendingUp size={12} className="mr-1" />+{summary?.viewsGrowth || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-sm text-muted">Redemptions</p>
                  <Info size={14} className="text-muted cursor-help" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-salmon/10">
                    <Gift size={18} className="text-accent-salmon" />
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-white">{summary ? summary.redemptions.toLocaleString() : '...'}</span>
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                <TrendingUp size={12} className="mr-1" />+{summary?.redemptionsGrowth || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-sm text-muted">Code Clips</p>
                  <Info size={14} className="text-muted cursor-help" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-lilac/10">
                    <Code size={18} className="text-accent-lilac" />
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-white">{summary ? summary.clips.toLocaleString() : '...'}</span>
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                <TrendingUp size={12} className="mr-1" />+{summary?.clipsGrowth || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
