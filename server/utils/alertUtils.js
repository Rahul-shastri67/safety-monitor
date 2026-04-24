/**
 * Alert Utility Functions
 */

const SEVERITY_MAP = {
  fight: { high: 0.80, critical: 0.90 },
  fall: { high: 0.75, critical: 0.88 },
  crowd_anomaly: { high: 0.70, critical: 0.85 },
  intrusion: { high: 0.75, critical: 0.90 },
  unknown: { high: 0.80, critical: 0.92 },
};

const DESCRIPTIONS = {
  fight: 'Physical altercation between individuals detected',
  fall: 'Person fall or collapse detected',
  crowd_anomaly: 'Unusual crowd behavior or gathering detected',
  intrusion: 'Unauthorized access or intrusion detected',
  normal: 'Normal activity detected',
  unknown: 'Unclassified anomaly detected',
};

/**
 * Determine severity level based on alert type and confidence
 */
exports.getSeverityFromType = (type, confidence) => {
  const thresholds = SEVERITY_MAP[type] || SEVERITY_MAP['unknown'];
  if (confidence >= thresholds.critical) return 'critical';
  if (confidence >= thresholds.high) return 'high';
  if (confidence >= 0.60) return 'medium';
  return 'low';
};

/**
 * Build a human-readable description
 */
exports.buildAlertDescription = (type, confidence, cameraName) => {
  const base = DESCRIPTIONS[type] || DESCRIPTIONS['unknown'];
  const pct = (confidence * 100).toFixed(1);
  return `${base} at ${cameraName} with ${pct}% confidence.`;
};

/**
 * Get alert color for UI
 */
exports.getAlertColor = (type) => {
  const colors = {
    fight: '#ef4444',
    fall: '#f97316',
    crowd_anomaly: '#eab308',
    intrusion: '#8b5cf6',
    normal: '#22c55e',
    unknown: '#6b7280',
  };
  return colors[type] || colors['unknown'];
};

/**
 * Format confidence as percentage string
 */
exports.formatConfidence = (confidence) => `${(confidence * 100).toFixed(1)}%`;
