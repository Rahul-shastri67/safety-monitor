import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [connected, setConnected]           = useState(false);
  const [liveAlerts, setLiveAlerts]         = useState([]);
  const [stats, setStats]                   = useState(null);
  const socketRef                           = useRef(null);
  const audioRef                            = useRef(null);

  // ─── Connect socket when user is authenticated ──────────────────────────────
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect',    () => { setConnected(true);  console.log('🔌 Socket connected'); });
    socket.on('disconnect', () => { setConnected(false); console.log('❌ Socket disconnected'); });
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message));

    // ─── New Alert from server ──────────────────────────────────────────────
    socket.on('new-alert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
      showAlertToast(alert);
      playAlertSound(alert);
    });

    socket.on('stats-update', (data) => setStats(data));

    return () => {
      socket.off('new-alert');
      socket.off('stats-update');
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  // ─── Alert Toast Notification ───────────────────────────────────────────────
  const showAlertToast = (alert) => {
    if (!user?.notifications?.realtime) return;

    const icons  = { fight: '🥊', fall: '⬇️', crowd_anomaly: '👥', intrusion: '🚨', normal: '✅' };
    const colors = { fight: '#ef4444', fall: '#f97316', crowd_anomaly: '#eab308', intrusion: '#8b5cf6' };

    if (alert.type === 'normal') return;

    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all
                      ${t.visible ? 'animate-slide-in' : 'opacity-0'}`}
          style={{
            background: '#0f1629',
            borderColor: colors[alert.type] || '#1e2d4a',
            borderLeftWidth: 4,
            maxWidth: 380,
          }}
        >
          <span style={{ fontSize: 22 }}>{icons[alert.type] || '⚠️'}</span>
          <div>
            <p className="font-bold text-white text-sm capitalize">
              {alert.type.replace('_', ' ')} Detected!
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              {alert.camera?.name} • {(alert.confidence * 100).toFixed(0)}% confidence
            </p>
          </div>
        </div>
      ),
      { duration: alert.severity === 'critical' ? 8000 : 5000 }
    );
  };

  // ─── Alert Sound ────────────────────────────────────────────────────────────
  const playAlertSound = (alert) => {
    if (!user?.notifications?.sound || alert.type === 'normal') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = alert.severity === 'critical' ? 880 : 660;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const clearLiveAlerts  = useCallback(() => setLiveAlerts([]), []);
  const joinCamera       = useCallback((id) => socketRef.current?.emit('join-camera', id), []);
  const leaveCamera      = useCallback((id) => socketRef.current?.emit('leave-camera', id), []);

  return (
    <SocketContext.Provider
      value={{ connected, liveAlerts, stats, clearLiveAlerts, joinCamera, leaveCamera }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
