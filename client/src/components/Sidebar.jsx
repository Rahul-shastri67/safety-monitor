import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Camera, History,
  Settings, Users, LogOut, Wifi, WifiOff, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import clsx from 'clsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cameras',   icon: Camera,          label: 'Live Cameras' },
  { to: '/history',   icon: History,         label: 'Incident History' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

const ADMIN_NAV = [
  { to: '/admin', icon: Users, label: 'Admin Panel' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const { connected, liveAlerts } = useSocket();
  const navigate = useNavigate();

  const activeAlerts = liveAlerts.filter(a => a.type !== 'normal').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0',
        'flex flex-col bg-surface-card border-r border-surface-border',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
        <div className="w-9 h-9 bg-brand/20 border border-brand/30 rounded-xl flex items-center justify-center">
          <Shield size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-none">SafeWatch</h1>
          <p className="text-slate-500 text-xs mt-0.5">AI Safety Monitor</p>
        </div>
      </div>

      {/* Connection status */}
      <div className="mx-4 mt-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-surface-border">
        {connected ? (
          <>
            <div className="pulse-dot" />
            <span className="text-xs text-success font-medium">Live Feed Active</span>
          </>
        ) : (
          <>
            <WifiOff size={12} className="text-slate-500" />
            <span className="text-xs text-slate-500">Disconnected</span>
          </>
        )}
        {activeAlerts > 0 && (
          <span className="ml-auto text-xs font-bold bg-danger text-white px-2 py-0.5 rounded-full">
            {activeAlerts}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 py-2">
          Navigation
        </p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active')
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-4">
              Administration
            </p>
            {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx('sidebar-link', isActive && 'active')
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface mb-2">
          <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-brand">
              {user?.name?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-danger hover:text-danger hover:bg-danger/10">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
