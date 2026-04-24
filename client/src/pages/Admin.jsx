import React, { useState, useEffect } from 'react';
import { Users, Camera, BarChart2, Trash2, Shield, ShieldAlert, UserCheck, Loader2, Plus } from 'lucide-react';
import { adminAPI } from '../services/api';
import { StatusBadge } from '../components/AlertBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TAB = ['Overview', 'Users', 'Cameras', 'Logs'];

export default function Admin() {
  const [tab, setTab]           = useState('Overview');
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [cameras, setCameras]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newCamera, setNewCamera] = useState(null);
  const [camForm, setCamForm]   = useState({ cameraId: '', name: '', location: '', zone: 'General' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, u, c] = await Promise.all([
        adminAPI.systemStats(),
        adminAPI.getUsers({ limit: 50 }),
        adminAPI.getCameras(),
      ]);
      setStats(s.data.data);
      setUsers(u.data.data);
      setCameras(c.data.data);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateUserRole = async (id, role) => {
    try {
      await adminAPI.updateUser(id, { role });
      setUsers(p => p.map(u => u._id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const toggleUserActive = async (id, isActive) => {
    try {
      await adminAPI.updateUser(id, { isActive });
      setUsers(p => p.map(u => u._id === id ? { ...u, isActive } : u));
      toast.success(isActive ? 'User activated' : 'User deactivated');
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(p => p.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const createCamera = async () => {
    try {
      await adminAPI.createCamera(camForm);
      toast.success('Camera added');
      setNewCamera(false);
      setCamForm({ cameraId: '', name: '', location: '', zone: 'General' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create camera'); }
  };

  const deleteCamera = async (id) => {
    if (!confirm('Delete camera?')) return;
    try {
      await adminAPI.deleteCamera(id);
      setCameras(p => p.filter(c => c._id !== id));
      toast.success('Camera removed');
    } catch { toast.error('Failed'); }
  };

  const ov = stats?.overview;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-slate-400 text-sm mt-1">System management &amp; configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl w-fit">
        {TAB.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t ? 'bg-brand text-white' : 'text-slate-400 hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: ov?.totalUsers, icon: Users, color: 'text-brand' },
              { label: 'Total Alerts', value: ov?.totalAlerts, icon: ShieldAlert, color: 'text-danger' },
              { label: 'Cameras Online', value: ov?.onlineCameras, icon: Camera, color: 'text-success' },
              { label: 'Active Alerts', value: ov?.activeAlerts, icon: Shield, color: 'text-warning' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <s.icon size={18} className={s.color} />
                <div>
                  <p className="text-2xl font-bold text-white">{loading ? '—' : (s.value ?? 0)}</p>
                  <p className="text-slate-400 text-sm">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alert trend */}
          {stats?.alertsByDay?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white text-sm mb-4">Alerts Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.alertsByDay} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                  <XAxis dataKey="_id" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e2d4a', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="fights"    name="Fights"    fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="falls"     name="Falls"     fill="#f97316" radius={[4,4,0,0]} />
                  <Bar dataKey="anomalies" name="Anomalies" fill="#eab308" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'Users' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['User', 'Role', 'Status', 'Last Login', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand">{u.name?.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.role}
                        onChange={e => updateUserRole(u._id, e.target.value)}
                        className="bg-surface border border-surface-border text-white text-xs rounded-lg px-2 py-1 focus:outline-none">
                        <option value="user">User</option>
                        <option value="operator">Operator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-semibold', u.isActive ? 'text-success' : 'text-slate-500')}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, HH:mm') : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleUserActive(u._id, !u.isActive)}
                          className="text-xs text-slate-400 hover:text-white">
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteUser(u._id)}
                          className="text-xs text-danger hover:text-danger/80">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cameras */}
      {tab === 'Cameras' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setNewCamera(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Camera
            </button>
          </div>

          {newCamera && (
            <div className="card border border-brand/20">
              <h3 className="font-semibold text-white mb-4">Add New Camera</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={camForm.cameraId} onChange={e => setCamForm(p => ({...p, cameraId: e.target.value}))}
                  placeholder="Camera ID (e.g. cam-01)" className="input text-sm" />
                <input value={camForm.name} onChange={e => setCamForm(p => ({...p, name: e.target.value}))}
                  placeholder="Camera Name" className="input text-sm" />
                <input value={camForm.location} onChange={e => setCamForm(p => ({...p, location: e.target.value}))}
                  placeholder="Location" className="input text-sm" />
                <select value={camForm.zone} onChange={e => setCamForm(p => ({...p, zone: e.target.value}))} className="input text-sm">
                  {['Entrance','Corridor','Classroom','Cafeteria','Parking','Library','Sports Ground','General'].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={createCamera} className="btn-primary flex-1">Add Camera</button>
                <button onClick={() => setNewCamera(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map(cam => (
              <div key={cam._id} className="card hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{cam.name}</p>
                    <p className="text-slate-500 text-xs">{cam.cameraId}</p>
                  </div>
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full',
                    cam.status === 'online' ? 'bg-success/20 text-success' : 'bg-slate-700 text-slate-400')}>
                    {cam.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 mb-4">
                  <p>📍 {cam.location}</p>
                  <p>🏢 {cam.zone}</p>
                  <p>🚨 {cam.totalAlerts} total alerts</p>
                </div>
                <button onClick={() => deleteCamera(cam._id)}
                  className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 transition-colors">
                  <Trash2 size={12} /> Remove Camera
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs placeholder */}
      {tab === 'Logs' && (
        <div className="card text-center py-10">
          <BarChart2 size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">System logs available — navigate to History page to view and filter all incidents.</p>
          <a href="/history" className="inline-block mt-4 text-brand text-sm hover:underline">Go to History →</a>
        </div>
      )}
    </div>
  );
}
