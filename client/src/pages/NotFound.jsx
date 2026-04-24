import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-8">
      <Shield size={48} className="text-brand/30 mb-6" />
      <h1 className="text-8xl font-bold text-surface-border mb-4">404</h1>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-slate-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary px-8 py-3">
        Back to Dashboard
      </Link>
    </div>
  );
}
