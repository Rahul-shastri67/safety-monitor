import React from 'react';
import clsx from 'clsx';

const CONFIG = {
  fight:        { label: 'Fight',          emoji: '🥊', color: 'text-danger   bg-danger/15   border-danger/30' },
  fall:         { label: 'Fall',           emoji: '⬇️', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  crowd_anomaly:{ label: 'Crowd Anomaly',  emoji: '👥', color: 'text-warning  bg-warning/15  border-warning/30' },
  intrusion:    { label: 'Intrusion',      emoji: '🚨', color: 'text-purple   bg-purple/15   border-purple/30' },
  normal:       { label: 'Normal',         emoji: '✅', color: 'text-success  bg-success/15  border-success/30' },
  unknown:      { label: 'Unknown',        emoji: '❓', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' },
};

const SEVERITY = {
  critical: 'text-red-400    bg-red-500/15    border-red-500/30',
  high:     'text-orange-400 bg-orange-500/15 border-orange-500/30',
  medium:   'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  low:      'text-slate-400  bg-slate-500/15  border-slate-500/30',
};

export const AlertBadge = ({ type, small }) => {
  const cfg = CONFIG[type] || CONFIG.unknown;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
      cfg.color,
      small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      <span>{cfg.emoji}</span>
      {!small && <span>{cfg.label}</span>}
    </span>
  );
};

export const SeverityBadge = ({ severity }) => (
  <span className={clsx(
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize',
    SEVERITY[severity] || SEVERITY.low
  )}>
    {severity}
  </span>
);

export const StatusBadge = ({ status }) => {
  const map = {
    active:       'text-danger  bg-danger/10  border-danger/30',
    acknowledged: 'text-brand   bg-brand/10   border-brand/30',
    resolved:     'text-success bg-success/10 border-success/30',
    false_positive: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  };
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize',
      map[status] || map.active
    )}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default AlertBadge;
