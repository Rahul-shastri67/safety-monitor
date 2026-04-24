import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const rules = [
  { test: v => v.length >= 8, label: 'At least 8 characters' },
  { test: v => /[A-Z]/.test(v), label: 'One uppercase letter' },
  { test: v => /[0-9]/.test(v), label: 'One number' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill in all fields'); return; }
    if (form.password.length < 8) { toast.error('Password must be 8+ characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand/20 border border-brand/30 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-brand" />
          </div>
          <span className="font-bold text-white text-lg">SafeWatch</span>
        </div>

        <div className="card">
          <h1 className="text-xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-slate-400 text-sm mb-6">Join the safety monitoring platform</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Full Name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="John Smith" className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle}
                  placeholder="Create a strong password" className="input pr-11" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {rules.map(r => (
                    <div key={r.label} className={`flex items-center gap-2 text-xs ${r.test(form.password) ? 'text-success' : 'text-slate-500'}`}>
                      <Check size={11} />
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-brand-light font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
