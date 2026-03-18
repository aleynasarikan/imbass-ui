import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/enterprise.css';

const EnterpriseDashboard = () => {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/influencers');
                setInfluencers(res.data);
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="enterprise-page">
            <header className="page-header">
                <div className="page-title-block">
                    <h1>Commercial Overview</h1>
                    <p>Real-time campaign performance and roster liquidity.</p>
                </div>
                <div className="page-actions">
                    <button className="btn-secondary">Export CSV</button>
                    <button className="btn-primary">Create Campaign</button>
                </div>
            </header>

            <div className="kpi-container">
                <div className="kpi-block">
                    <div className="kpi-label">Active Negotiations</div>
                    <div className="kpi-value">14</div>
                </div>
                <div className="kpi-block">
                    <div className="kpi-label">Total Contract Value</div>
                    <div className="kpi-value">$248,500.00</div>
                </div>
                <div className="kpi-block">
                    <div className="kpi-label">Roster Utilization</div>
                    <div className="kpi-value">72.4%</div>
                </div>
                <div className="kpi-block">
                    <div className="kpi-label">Pending Settlements</div>
                    <div className="kpi-value">9</div>
                </div>
            </div>

            <div className="data-surface">
                <div className="surface-header">
                    <h3>Creator Roster Liquidity</h3>
                    <div className="table-filters">
                        <select className="select-input">
                            <all>All Platforms</all>
                            <option>Instagram</option>
                            <option>YouTube</option>
                            <option>TikTok</option>
                        </select>
                    </div>
                </div>
                {loading ? (
                    <div className="loading-state">Syncing with ledger...</div>
                ) : (
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Creator Entity</th>
                                <th>Primary Platform</th>
                                <th>Audience Reach</th>
                                <th>Negotiation Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {influencers.map((inf) => (
                                <tr key={inf.id}>
                                    <td className="font-semibold">{inf.name}</td>
                                    <td>
                                        <span className="platform-tag">{inf.platform}</span>
                                    </td>
                                    <td>{inf.followers}</td>
                                    <td>
                                        <span className="status-indicator-flat">Active Bid</span>
                                    </td>
                                    <td>
                                        <button className="text-btn">Manage</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
        .enterprise-page {
          padding-top: var(--enterprise-spacing-lg);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: var(--enterprise-spacing-lg);
        }

        .page-title-block h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--enterprise-text-primary);
          margin: 0 0 4px 0;
        }

        .page-title-block p {
          color: var(--enterprise-text-secondary);
          margin: 0;
          font-size: 14px;
        }

        .page-actions {
          display: flex;
          gap: 12px;
        }

        .data-surface {
          background: var(--enterprise-surface);
          border: 1px solid var(--enterprise-border);
          border-radius: var(--enterprise-radius);
        }

        .surface-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--enterprise-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .surface-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .platform-tag {
          font-size: 11px;
          font-weight: 600;
          background: #F1F5F9;
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--enterprise-text-secondary);
        }

        .status-indicator-flat {
          font-size: 12px;
          color: var(--enterprise-success);
          font-weight: 500;
        }

        .text-btn {
          background: none;
          border: none;
          color: var(--enterprise-accent);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
        }

        .select-input {
          padding: 6px 12px;
          border: 1px solid var(--enterprise-border);
          border-radius: 4px;
          font-size: 13px;
          outline: none;
          background: #F8FAFC;
        }

        .loading-state {
          padding: 40px;
          text-align: center;
          color: var(--enterprise-text-secondary);
          font-style: italic;
        }

        .font-semibold {
            font-weight: 600;
        }
      `}</style>
        </div>
    );
};

export default EnterpriseDashboard;
