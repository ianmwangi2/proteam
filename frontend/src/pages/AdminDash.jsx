import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import usePageTitle from '../hooks/usePageTitle';
import './AdminDash.css';

const statusColors = {
  pending:  '#f59e0b',
  quoted:   '#2e94d1',
  accepted: '#34c76e',
  declined: '#f05252',
  expired:  '#6b7280',
};

const statusBadge = (status) => ({
  color: statusColors[status] || '#6b7280',
  background: `${statusColors[status] || '#6b7280'}18`,
  border: `1px solid ${statusColors[status] || '#6b7280'}33`,
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'capitalize',
  display: 'inline-block',
});

export default function AdminDash() {
  const { getToken, profile } = useAuth();
  const navigate = useNavigate();
  usePageTitle('Admin Dashboard');
  const [quotations, setQuotations] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        const [quotRes, usersData, servicesData] = await Promise.all([
          apiFetch('/quotations', { token }),
          apiFetch('/users', { token }),
          apiFetch('/services', { token }),
        ]);
        const quots = Array.isArray(quotRes) ? quotRes : (quotRes.data || []);
        setQuotations(quots);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingCount  = quotations.filter(q => q.status === 'pending').length;
  const quotedCount   = quotations.filter(q => q.status === 'quoted').length;
  const acceptedCount = quotations.filter(q => q.status === 'accepted').length;

  const stats = [
    { label: 'Total Quotations', value: String(quotations.length), change: `${acceptedCount} accepted`,   positive: true,  icon: '📋' },
    { label: 'Pending Review',   value: String(pendingCount),        change: pendingCount > 0 ? 'Needs attention' : 'All clear', positive: pendingCount === 0, icon: '⏳' },
    { label: 'Quoted',           value: String(quotedCount),          change: `Awaiting client`,             positive: true,  icon: '💬' },
    { label: 'Registered Users', value: String(users.length),         change: `${services.length} services`, positive: true,  icon: '👥' },
  ];

  // Monthly quotation volume chart
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyMap = {};
  monthNames.forEach(m => { monthlyMap[m] = 0; });
  quotations.forEach(q => {
    const m = monthNames[new Date(q.created_at).getMonth()];
    monthlyMap[m] += 1;
  });
  const chartData = monthNames.map(m => ({ m, count: monthlyMap[m] }));
  const maxMonth = chartData.reduce((prev, curr) => curr.count > prev.count ? curr : prev, chartData[0]);

  // Recent 5 quotations
  const recentQuotations = quotations.slice(0, 5);

  return (
    <div className="admin-page">
      <AdminSidebar />

      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Welcome back, {profile?.full_name || 'Admin'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn-icon relative"
              id="admin-bell-btn"
              onClick={() => navigate('/admin/quotations')}
              aria-label={`${pendingCount} pending quotations`}
            >
              <Bell size={18} />
              {pendingCount > 0 && <span className="admin-bell-badge">{pendingCount}</span>}
            </button>
            <div className="admin-user-chip">
              <div className="admin-avatar-sm" />
              <span>{profile?.full_name || 'Admin'}</span>
            </div>
          </div>
        </div>

        <div className="admin-body">
          {/* Stats */}
          <div className="admin-stats">
            {stats.map(s => (
              <div key={s.label} className="admin-stat-card card card-padded" id={`admin-stat-${s.label.replace(/\s+/g,'-').toLowerCase()}`}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: s.positive ? 'var(--color-green-primary)' : 'var(--color-red)' }}>{s.change}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{s.label}</p>
                <strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>{loading ? '—' : s.value}</strong>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="admin-charts">
            <div className="admin-chart-card card card-padded">
              <h3 style={{ marginBottom: 20 }}>Monthly Quotations</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="m" tick={{ fill:'#4b5563', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#4b5563', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background:'#0d1a0d', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, color:'#f0fdf4', fontSize:12 }}
                    formatter={v => [`${v} quotation${v !== 1 ? 's' : ''}`]}
                  />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.m === maxMonth.m && maxMonth.count > 0 ? '#34c76e' : '#0f2318'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div className="admin-activity card card-padded">
              <h3 style={{ marginBottom: 20 }}>Recent Quotations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentQuotations.length === 0 && !loading && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No quotations yet.</p>
                )}
                {recentQuotations.map(q => (
                  <div
                    key={q.id}
                    style={{ display:'flex', alignItems:'center', gap: 12, cursor:'pointer' }}
                    onClick={() => navigate(`/admin/quotations/${q.id}`)}
                  >
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>
                      📋
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize:'0.875rem', fontWeight:600, margin:0 }}>
                        Quote #{q.id} — {q.profile?.full_name || q.services?.name || 'General'}
                      </p>
                      <p style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', margin:0 }}>
                        {new Date(q.created_at).toLocaleDateString()} · {q.services?.name || 'No service'}
                      </p>
                    </div>
                    <span style={statusBadge(q.status)}>{q.status}</span>
                  </div>
                ))}
              </div>
              {quotations.length > 5 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate('/admin/quotations')}
                  style={{ marginTop: 16, width: '100%' }}
                >
                  View all {quotations.length} quotations →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
