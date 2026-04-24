/**
 * Camera Model - CCTV Camera Registry
 */

const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Camera name is required'],
      trim: true,
      maxlength: 100,
    },
    location: {
      type: String,
      required: [true, 'Camera location is required'],
      trim: true,
    },
    zone: {
      type: String,
      default: 'General',
      enum: ['Entrance', 'Corridor', 'Classroom', 'Cafeteria', 'Parking', 'Library', 'Sports Ground', 'General'],
    },
    streamUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'maintenance', 'error'],
      default: 'offline',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resolution: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 },
    },
    fps: {
      type: Number,
      default: 30,
    },
    detectionEnabled: {
      type: Boolean,
      default: true,
    },
    alertThreshold: {
      fight: { type: Number, default: 0.75 },
      fall: { type: Number, default: 0.70 },
      crowd_anomaly: { type: Number, default: 0.65 },
      intrusion: { type: Number, default: 0.80 },
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    totalAlerts: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    assignedOperators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    metadata: {
      brand: String,
      model: String,
      installedDate: Date,
      notes: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

CameraSchema.index({ cameraId: 1 });
CameraSchema.index({ status: 1 });
CameraSchema.index({ zone: 1 });

module.exports = mongoose.model('Camera', CameraSchema);
