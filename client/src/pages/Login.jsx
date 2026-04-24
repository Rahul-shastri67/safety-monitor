import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/dashboard';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@safetymonitor.com', password: 'Admin@123456' });
    else setForm({ email: 'user@safetymonitor.com', password: 'User@123456' });
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-surface-card border-r border-surface-border relative overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-purple/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand/20 border border-brand/30 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-brand" />
            </div>
            <span className="font-bold text-xl text-white">SafeWatch</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            AI-Powered<br />
            <span className="text-brand">Safety Monitoring</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Real-time detection of fights, falls, and crowd anomalies across your CCTV network.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { icon: '🥊', label: 'Fight Detection',    sub: 'Instant alerts on physical altercations' },
              { icon: '⬇️', label: 'Fall Detection',     sub: 'Identify slips, trips, and collapses' },
              { icon: '👥', label: 'Crowd Anomaly',      sub: 'Monitor unusual gathering patterns' },
              { icon: '📡', label: 'Real-Time Alerts',   sub: 'WebSocket-powered instant notifications' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-4 p-3 rounded-xl bg-surface/50 border border-surface-border/50">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-slate-500 text-xs">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © 2024 SafeWatch. Built for hackathon — portfolio project.
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield size={22} className="text-brand" />
            <span className="font-bold text-white text-lg">SafeWatch</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your monitoring dashboard</p>

          {/* Demo creds */}
          <div className="mb-6 p-4 rounded-xl bg-brand/10 border border-brand/20 text-xs">
            <p className="text-brand font-semibold mb-2">🚀 Demo Credentials</p>
            <div className="flex gap-3">
              <button onClick={() => fillDemo('admin')} className="flex-1 py-1.5 rounded-lg bg-brand/20 hover:bg-brand/30 text-white transition-colors">
                Admin Login
              </button>
              <button onClick={() => fillDemo('user')} className="flex-1 py-1.5 rounded-lg bg-surface-border hover:bg-surface-hover text-slate-400 transition-colors">
                User Login
              </button>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email Address</label>
              <input
                name="email" type="email" value={form.email} onChange={handle}
                placeholder="you@example.com" className="input" autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={handle}
                  placeholder="Enter your password" className="input pr-11" autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand hover:text-brand-light font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
