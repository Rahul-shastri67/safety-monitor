/**
 * Alert Model - Incident Detection Logs
 */

const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      enum: ['fight', 'fall', 'crowd_anomaly', 'intrusion', 'normal', 'unknown'],
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    camera: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      location: { type: String, default: 'Unknown Location' },
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    videoClipUrl: {
      type: String,
      default: null,
    },
    rawPrediction: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'false_positive'],
      default: 'active',
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    tags: [String],
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    frameNumber: {
      type: Number,
      default: null,
    },
    boundingBoxes: [
      {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        label: String,
        confidence: Number,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────
AlertSchema.index({ detectedAt: -1 });
AlertSchema.index({ type: 1, detectedAt: -1 });
AlertSchema.index({ 'camera.id': 1, detectedAt: -1 });
AlertSchema.index({ status: 1, detectedAt: -1 });

// ─── Virtual: Time since detection ───────────────────────────────────────────
AlertSchema.virtual('timeSinceDetection').get(function () {
  const diff = Date.now() - this.detectedAt;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
});

// ─── Static: Get stats summary ────────────────────────────────────────────────
AlertSchema.statics.getStatsSummary = async function (dateFrom, dateTo) {
  const match = {};
  if (dateFrom || dateTo) {
    match.detectedAt = {};
    if (dateFrom) match.detectedAt.$gte = new Date(dateFrom);
    if (dateTo) match.detectedAt.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        lastDetected: { $max: '$detectedAt' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// ─── Static: Get hourly distribution ─────────────────────────────────────────
AlertSchema.statics.getHourlyDistribution = async function (days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return this.aggregate([
    { $match: { detectedAt: { $gte: since }, type: { $ne: 'normal' } } },
    {
      $group: {
        _id: {
          hour: { $hour: '$detectedAt' },
          day: { $dayOfWeek: '$detectedAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.day': 1, '_id.hour': 1 } },
  ]);
};

module.exports = mongoose.model('Alert', AlertSchema);
