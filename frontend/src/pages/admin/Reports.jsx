import { useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import usePageTitle from '../../hooks/usePageTitle';
import '../AdminDash.css';
import './Reports.css';

const COLORS = ['#34c76e', '#2e94d1', '#f59e0b', '#f05252', '#6b7280'];
const STATUS_LABELS = { pending: 'Pending', quoted: 'Quoted', accepted: 'Accepted', declined: 'Declined', expired: 'Expired' };
const tooltipStyle = {
  contentStyle: { background: '#0a1810', border: '1px solid #112619', borderRadius: 10, fontSize: '0.8125rem' },
  labelStyle: { color: '#888' },
};
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  usePageTitle('Reports');
  const { getToken } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        const [quotRes, svcRes] = await Promise.all([
          apiFetch('/quotations', { token }),
          apiFetch('/services', { token }),
        ]);
        setQuotations(Array.isArray(quotRes) ? quotRes : (quotRes.data || []));
        setServices(Array.isArray(svcRes) ? svcRes : []);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalQuotations = quotations.length;
  const acceptedCount   = quotations.filter(q => q.status === 'accepted').length;
  const conversionRate  = totalQuotations > 0 ? Math.round((acceptedCount / totalQuotations) * 100) : 0;
  const pendingCount    = quotations.filter(q => q.status === 'pending').length;

  // Monthly quotation volume trend
  const monthlyData = useMemo(() => {
    const countMap = {};
    monthNames.forEach(m => { countMap[m] = 0; });
    quotations.forEach(q => {
      const m = monthNames[new Date(q.created_at).getMonth()];
      countMap[m] += 1;
    });
    return monthNames.map(m => ({ month: m, count: countMap[m] }));
  }, [quotations]);

  // Status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const tally = { pending: 0, quoted: 0, accepted: 0, declined: 0, expired: 0 };
    quotations.forEach(q => { if (tally[q.status] !== undefined) tally[q.status]++; });
    return Object.entries(tally)
      .filter(([, v]) => v > 0)
      .map(([key, value], i) => ({ name: STATUS_LABELS[key] || key, value, fill: COLORS[i] }));
  }, [quotations]);

  // Top services by quotation volume
  const topServices = useMemo(() => {
    const svcMap = {};
    quotations.forEach(q => {
      const name = q.services?.name || 'General Inquiry';
      if (!svcMap[name]) svcMap[name] = { count: 0, accepted: 0 };
      svcMap[name].count++;
      if (q.status === 'accepted') svcMap[name].accepted++;
    });
    return Object.entries(svcMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [quotations]);

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Reports</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Quotation performance overview
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-icon relative"><Bell size={18} /></button>
            <div className="admin-user-chip">
              <div className="admin-avatar-sm" />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <div className="admin-body">
          {/* Summary */}
          <div className="rpt-summary-row">
            <div className="rpt-summary-card card card-padded">
              <span className="rpt-summary-label">Total Quotations</span>
              <strong className="rpt-summary-val" style={{ color: 'var(--color-green-primary)' }}>
                {loading ? '—' : totalQuotations}
              </strong>
            </div>
            <div className="rpt-summary-card card card-padded">
              <span className="rpt-summary-label">Accepted</span>
              <strong className="rpt-summary-val">{loading ? '—' : acceptedCount}</strong>
            </div>
            <div className="rpt-summary-card card card-padded">
              <span className="rpt-summary-label">Conversion Rate</span>
              <strong className="rpt-summary-val">{loading ? '—' : `${conversionRate}%`}</strong>
            </div>
            <div className="rpt-summary-card card card-padded">
              <span className="rpt-summary-label">Pending Review</span>
              <strong className="rpt-summary-val" style={{ color: pendingCount > 0 ? '#f59e0b' : 'inherit' }}>
                {loading ? '—' : pendingCount}
              </strong>
            </div>
          </div>

          {/* Charts row */}
          <div className="rpt-charts-row">
            <div className="card card-padded rpt-chart-card">
              <h3 className="rpt-chart-title">Monthly Quotation Volume</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                  <Tooltip formatter={v => [`${v} quotation${v !== 1 ? 's' : ''}`]} {...tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.count > 0 ? '#34c76e' : '#34c76e55'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card card-padded rpt-chart-card">
              <h3 className="rpt-chart-title">Status Breakdown</h3>
              {statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:260, color:'var(--color-text-muted)' }}>
                  No data yet
                </div>
              )}
            </div>
          </div>

          {/* Top Services */}
          <div className="card card-padded" style={{ marginTop: 20 }}>
            <h3 className="rpt-chart-title">Top Services by Quotation Volume</h3>
            <div className="rpt-prod-table">
              <div className="rpt-prod-header">
                <span>#</span>
                <span>Service</span>
                <span>Quotations</span>
                <span>Accepted</span>
              </div>
              {topServices.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '16px 0' }}>No data yet.</p>
              )}
              {topServices.map((s, i) => (
                <div key={i} className="rpt-prod-row">
                  <span className="rpt-rank" style={{ background: COLORS[i] || COLORS[4] }}>{i + 1}</span>
                  <strong className="rpt-prod-name">{s.name}</strong>
                  <span>{s.count} quotation{s.count !== 1 ? 's' : ''}</span>
                  <strong style={{ color: 'var(--color-green-primary)' }}>{s.accepted} accepted</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
