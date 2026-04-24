import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, Camera, CheckCircle,
  TrendingUp, TrendingDown, Zap, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { analyticsAPI, alertAPI, cameraAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import AlertBadge, { SeverityBadge, StatusBadge } from '../components/AlertBadge';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, trend, color = 'text-brand', loading }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div className={`p-2.5 rounded-xl ${color === 'text-danger' ? 'bg-danger/15' : color === 'text-success' ? 'bg-success/15' : color === 'text-warning' ? 'bg-warning/15' : 'bg-brand/15'}`}>
        <Icon size={18} className={color} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-danger' : 'text-success'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      {loading ? (
        <div className="h-8 w-20 bg-surface-border rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      )}
      <p className="text-slate-400 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-2xl">
      <p className="text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const PIE_COLORS = { fight: '#ef4444', fall: '#f97316', crowd_anomaly: '#eab308', intrusion: '#8b5cf6', normal: '#10b981', unknown: '#6b7280' };

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { liveAlerts } = useSocket();
  const { isAdmin, isOperator } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, alertsRes, cameraRes] = await Promise.all([
        analyticsAPI.dashboard(),
        alertAPI.getAll({ limit: 8, sort: '-detectedAt' }),
        cameraAPI.getAll(),
      ]);
      setAnalytics(analyticsRes.data.data);
      setRecentAlerts(alertsRes.data.data);
      setCameras(cameraRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Refresh alerts list when live alerts come in
  useEffect(() => {
    if (liveAlerts.length > 0) {
      alertAPI.getAll({ limit: 8, sort: '-detectedAt' })
        .then(r => setRecentAlerts(r.data.data))
        .catch(() => {});
    }
  }, [liveAlerts]);

  const simulateAlert = async (type) => {
    if (cameras.length === 0) { toast.error('No cameras configured'); return; }
    setSimulating(true);
    try {
      const cam = cameras[Math.floor(Math.random() * cameras.length)];
      await cameraAPI.simulate(cam.cameraId, { type, confidence: 0.8 + Math.random() * 0.18 });
      toast.success(`${type} alert simulated on ${cam.name}`);
    } catch (err) {
      // Fallback: simulate directly
      await alertAPI.detect({
        cameraId: 'cam-demo',
        cameraName: 'Demo Camera',
        location: 'Demo Area',
      });
    } finally {
      setSimulating(false);
    }
  };

  const pieData = analytics?.byType?.map(t => ({
    name: t._id.replace('_', ' '),
    value: t.count,
    fill: PIE_COLORS[t._id] || '#6b7280',
  })) || [];

  const trendData = analytics?.trend?.map(d => ({
    date: d._id?.slice(5),
    Fights: d.fights || 0,
    Falls: d.falls || 0,
    Anomalies: d.anomalies || 0,
    Total: d.total || 0,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time AI-powered incident monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          {(isAdmin || isOperator) && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">Simulate:</span>
              {['fight', 'fall', 'crowd_anomaly'].map(type => (
                <button
                  key={type}
                  onClick={() => simulateAlert(type)}
                  disabled={simulating}
                  className="text-xs px-3 py-1.5 rounded-lg border border-surface-border hover:border-brand/50 hover:text-brand text-slate-400 transition-all capitalize disabled:opacity-50"
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Alerts Today"   value={analytics?.today}        icon={AlertTriangle} color="text-danger"  trend={analytics?.changeFromYesterday} loading={loading} sub={`${analytics?.yesterday ?? 0} yesterday`} />
        <StatCard label="Active Alerts"  value={analytics?.activeAlerts}  icon={Zap}           color="text-warning" loading={loading} sub="Needs attention" />
        <StatCard label="This Week"      value={analytics?.weekTotal}     icon={Activity}      color="text-brand"   loading={loading} sub="Last 7 days" />
        <StatCard label="Cameras Online" value={cameras.filter(c => c.status === 'online').length} icon={Camera} color="text-success" loading={loading} sub={`of ${cameras.length} total`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white text-sm">Incident Trend (7 Days)</h3>
            <span className="text-xs text-slate-500">Daily breakdown</span>
          </div>
          {trendData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-500 text-sm">
              No data yet. Alerts will appear here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendData} margin={{ left: -10 }}>
                <defs>
                  {[['Fights', '#ef4444'], ['Falls', '#f97316'], ['Anomalies', '#eab308']].map(([k, c]) => (
                    <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="Fights"    stroke="#ef4444" fill="url(#gFights)"    strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Falls"     stroke="#f97316" fill="url(#gFalls)"     strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Anomalies" stroke="#eab308" fill="url(#gAnomalies)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white text-sm">Alert Distribution</h3>
          </div>
          {pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#0f1629', border: '1px solid #1e2d4a', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {pieData.slice(0, 4).map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                  <span className="text-slate-400 capitalize">{d.name}</span>
                </div>
                <span className="text-white font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Recent Incidents</h3>
          <a href="/history" className="text-xs text-brand hover:text-brand-light transition-colors">View all →</a>
        </div>
        {recentAlerts.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No incidents detected. System is monitoring.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map(alert => (
              <div key={alert._id} className="alert-row">
                <AlertBadge type={alert.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{alert.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📷 {alert.camera?.name} · 📍 {alert.camera?.location}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <SeverityBadge severity={alert.severity} />
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}
                  </p>
                </div>
                <StatusBadge status={alert.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Grid Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Camera Status</h3>
          <a href="/cameras" className="text-xs text-brand hover:text-brand-light">Manage cameras →</a>
        </div>
        {cameras.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No cameras configured. Add cameras in Admin Panel.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cameras.slice(0, 8).map(cam => (
              <div key={cam._id} className="bg-surface border border-surface-border rounded-lg p-3 hover:border-slate-600 transition-colors">
                <div className="aspect-video bg-surface-border rounded mb-2 flex items-center justify-center relative overflow-hidden scanline">
                  <Camera size={20} className="text-slate-600" />
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-success' : 'bg-slate-600'}`} />
                </div>
                <p className="text-xs font-semibold text-white truncate">{cam.name}</p>
                <p className="text-xs text-slate-500 truncate">{cam.location}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-xs font-medium capitalize ${cam.status === 'online' ? 'text-success' : 'text-slate-500'}`}>
                    {cam.status}
                  </span>
                  <span className="text-xs text-slate-600">{cam.totalAlerts} alerts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
