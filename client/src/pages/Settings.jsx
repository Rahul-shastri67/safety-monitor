import React, { useState } from 'react';
import { Bell, Lock, User, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [name, setName]         = useState(user?.name || '');
  const [notifications, setNotifications] = useState(user?.notifications || { email: true, realtime: true, sound: true });
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, notifications });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be 8+ characters'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <User size={16} className="text-brand" />
          <h3 className="font-semibold text-white">Profile Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email Address</label>
            <input value={user?.email} disabled className="input opacity-50 cursor-not-allowed" />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Role</label>
            <span className="inline-flex px-3 py-1.5 bg-brand/15 border border-brand/30 text-brand text-sm font-semibold rounded-lg capitalize">
              {user?.role}
            </span>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Bell size={16} className="text-brand" />
          <h3 className="font-semibold text-white">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'realtime', label: 'Real-time Alert Toasts', sub: 'Show popup notifications for new incidents' },
            { key: 'sound',   label: 'Alert Sound',            sub: 'Play a sound when critical alerts occur' },
            { key: 'email',   label: 'Email Notifications',    sub: 'Receive incident reports via email (future)' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-surface-border/50 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
              </div>
              <button
                onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-brand' : 'bg-surface-border'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Preferences
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Lock size={16} className="text-brand" />
          <h3 className="font-semibold text-white">Change Password</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword',     label: 'New Password' },
            { key: 'confirm',         label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">{label}</label>
              <input type="password" value={pwForm[key]}
                onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder="••••••••" className="input" />
            </div>
          ))}
          <button onClick={changePassword} disabled={savingPw} className="btn-primary flex items-center gap-2">
            {savingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Update Password
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="card border border-surface-border/50">
        <h3 className="font-semibold text-white text-sm mb-3">System Information</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Version',     value: '1.0.0' },
            { label: 'Stack',       value: 'MERN + AI' },
            { label: 'AI Engine',   value: 'Python FastAPI' },
            { label: 'Real-time',   value: 'Socket.io' },
            { label: 'Auth',        value: 'JWT RS256' },
            { label: 'Database',    value: 'MongoDB Atlas' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-surface-border/30">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-300 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
