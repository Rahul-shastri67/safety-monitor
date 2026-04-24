import React, { useState } from 'react';
import { Menu, Bell, Search, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import AlertBadge from './AlertBadge';

const Topbar = ({ onMenuClick }) => {
  const { liveAlerts, clearLiveAlerts } = useSocket();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = liveAlerts.filter(a => a.type !== 'normal').length;

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-surface-border bg-surface-card/50 backdrop-blur-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2 w-64">
          <Search size={14} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search incidents..."
            className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 relative">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-surface-hover text-slate-400 hover:text-white transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center font-bold animate-ping-once">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-12 w-96 bg-surface-card border border-surface-border rounded-xl shadow-2xl z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                <h3 className="font-semibold text-white text-sm">Live Alerts</h3>
                <div className="flex items-center gap-2">
                  {liveAlerts.length > 0 && (
                    <button onClick={clearLiveAlerts} className="text-xs text-slate-400 hover:text-white">
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {liveAlerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    No live alerts
                  </div>
                ) : (
                  liveAlerts.slice(0, 15).map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover border-b border-surface-border/50 transition-colors">
                      <AlertBadge type={alert.type} small />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium capitalize">
                          {alert.type?.replace('_', ' ')} — {alert.camera?.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(alert.confidence * 100).toFixed(0)}% confidence •{' '}
                          {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center cursor-pointer">
          <span className="text-xs font-bold text-brand">
            {user?.name?.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
