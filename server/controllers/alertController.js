/**
 * Alert Controller - Incident Management + AI Integration
 */

const axios = require('axios');
const Alert = require('../models/Alert');
const Camera = require('../models/Camera');
const { broadcastAlert } = require('../config/socket');
const logger = require('../utils/logger');
const { getSeverityFromType, buildAlertDescription } = require('../utils/alertUtils');

// ─── @GET /api/alerts ─────────────────────────────────────────────────────────
exports.getAlerts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      status,
      cameraId,
      from,
      to,
      sort = '-detectedAt',
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (cameraId) filter['camera.id'] = cameraId;
    if (from || to) {
      filter.detectedAt = {};
      if (from) filter.detectedAt.$gte = new Date(from);
      if (to) filter.detectedAt.$lte = new Date(to);
    }

    // Non-admin users only see their camera alerts
    if (req.user.role === 'user') {
      filter['camera.id'] = { $in: req.user.assignedCameras || [] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('acknowledgedBy', 'name email')
        .populate('resolvedBy', 'name email')
        .lean(),
      Alert.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/alerts/:id ─────────────────────────────────────────────────────
exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('acknowledgedBy', 'name email')
      .populate('resolvedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/alerts/detect ─────────────────────────────────────────────────
// Receive video frame/clip → call AI service → store alert → broadcast
exports.detectAndCreateAlert = async (req, res, next) => {
  try {
    const { cameraId, cameraName, location, frameData, videoUrl } = req.body;

    let prediction = null;
    let aiError = null;

    // ─── Call AI Service ───────────────────────────────────────────────────
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/predict`,
        {
          frame_data: frameData,
          video_url: videoUrl,
          camera_id: cameraId,
        },
        {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      prediction = aiResponse.data;
    } catch (err) {
      logger.warn(`AI service unavailable, using mock: ${err.message}`);
      aiError = err.message;

      // Mock prediction for development/testing
      prediction = generateMockPrediction();
    }

    // Skip saving 'normal' with low confidence
    if (prediction.label === 'normal' && prediction.confidence < 0.9) {
      return res.status(200).json({
        success: true,
        message: 'Normal activity detected - no alert created',
        prediction,
      });
    }

    // ─── Create Alert Record ──────────────────────────────────────────────
    const severity = getSeverityFromType(prediction.label, prediction.confidence);
    const description = buildAlertDescription(prediction.label, prediction.confidence, cameraName);

    const alert = await Alert.create({
      type: prediction.label || 'unknown',
      severity,
      confidence: prediction.confidence,
      camera: {
        id: cameraId,
        name: cameraName || `Camera ${cameraId}`,
        location: location || 'Unknown',
      },
      description,
      rawPrediction: prediction,
      detectedAt: new Date(),
      thumbnailUrl: prediction.thumbnail_url || null,
      boundingBoxes: prediction.bounding_boxes || [],
      status: 'active',
    });

    // ─── Update Camera Stats ──────────────────────────────────────────────
    await Camera.findOneAndUpdate(
      { cameraId },
      { $inc: { totalAlerts: 1 }, lastSeen: new Date() }
    );

    // ─── Broadcast via Socket.io ──────────────────────────────────────────
    broadcastAlert({
      id: alert._id,
      type: alert.type,
      severity: alert.severity,
      confidence: alert.confidence,
      camera: alert.camera,
      description: alert.description,
      detectedAt: alert.detectedAt,
      thumbnailUrl: alert.thumbnailUrl,
    });

    logger.info(`🚨 Alert created: ${alert.type} | Camera: ${cameraId} | Confidence: ${(alert.confidence * 100).toFixed(1)}%`);

    res.status(201).json({
      success: true,
      message: 'Alert detected and logged',
      data: alert,
      aiError: aiError ? `AI service fallback: ${aiError}` : null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/alerts/upload-detect ─────────────────────────────────────────
// Upload video file → send to AI → create alert
exports.detectFromUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const { cameraId = 'upload', cameraName = 'Uploaded Video', location = 'Manual Upload' } = req.body;
    const videoPath = req.file.path;

    let prediction;
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      const form = new FormData();
      form.append('video', fs.createReadStream(videoPath));
      form.append('camera_id', cameraId);

      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/predict/video`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 60000,
        }
      );
      prediction = aiResponse.data;
    } catch (err) {
      logger.warn(`AI service unavailable for upload: ${err.message}`);
      prediction = generateMockPrediction();
    }

    const severity = getSeverityFromType(prediction.label, prediction.confidence);

    const alert = await Alert.create({
      type: prediction.label || 'unknown',
      severity,
      confidence: prediction.confidence,
      camera: { id: cameraId, name: cameraName, location },
      description: buildAlertDescription(prediction.label, prediction.confidence, cameraName),
      rawPrediction: prediction,
      detectedAt: new Date(),
      status: 'active',
    });

    broadcastAlert({
      id: alert._id,
      type: alert.type,
      severity: alert.severity,
      confidence: alert.confidence,
      camera: alert.camera,
      description: alert.description,
      detectedAt: alert.detectedAt,
    });

    res.status(201).json({ success: true, data: alert, prediction });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/alerts/:id/acknowledge ────────────────────────────────────────
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user.id,
        acknowledgedAt: new Date(),
        notes: req.body.notes || '',
      },
      { new: true }
    ).populate('acknowledgedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    logger.info(`Alert ${req.params.id} acknowledged by ${req.user.email}`);
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/alerts/:id/resolve ────────────────────────────────────────────
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.falsePositive ? 'false_positive' : 'resolved',
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        notes: req.body.notes || '',
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/alerts/stats/summary ──────────────────────────────────────────
exports.getAlertStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const [summary, hourly, recent] = await Promise.all([
      Alert.getStatsSummary(from, to),
      Alert.getHourlyDistribution(7),
      Alert.find({ type: { $ne: 'normal' } })
        .sort('-detectedAt')
        .limit(5)
        .lean(),
    ]);

    // Count by status
    const statusCounts = await Alert.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: { summary, hourly, recent, statusCounts },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Mock Prediction Generator (fallback) ────────────────────────────────────
function generateMockPrediction() {
  const labels = ['fight', 'fall', 'crowd_anomaly', 'normal', 'intrusion'];
  const weights = [0.15, 0.15, 0.10, 0.50, 0.10];

  let rand = Math.random();
  let label = 'normal';
  let cumulative = 0;

  for (let i = 0; i < labels.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      label = labels[i];
      break;
    }
  }

  const confidence = label === 'normal'
    ? 0.85 + Math.random() * 0.14
    : 0.65 + Math.random() * 0.34;

  return {
    label,
    confidence: parseFloat(confidence.toFixed(4)),
    all_scores: {
      fight: label === 'fight' ? confidence : Math.random() * 0.3,
      fall: label === 'fall' ? confidence : Math.random() * 0.3,
      crowd_anomaly: label === 'crowd_anomaly' ? confidence : Math.random() * 0.2,
      normal: label === 'normal' ? confidence : Math.random() * 0.4,
      intrusion: label === 'intrusion' ? confidence : Math.random() * 0.2,
    },
    processing_time_ms: Math.floor(Math.random() * 300 + 100),
    model_version: 'mock-v1.0',
    bounding_boxes: label !== 'normal' ? [
      { x: 0.2, y: 0.1, width: 0.3, height: 0.6, label, confidence },
    ] : [],
  };
}
