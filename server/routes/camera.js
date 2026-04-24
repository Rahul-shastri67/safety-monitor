// ─── Camera Routes ────────────────────────────────────────────────────────────
const express = require('express');
const cameraRouter = express.Router();
const Camera = require('../models/Camera');
const { protect } = require('../middleware/auth');
const { broadcastAlert } = require('../config/socket');

cameraRouter.use(protect);

// Get all cameras (filtered by user's assigned cameras for non-admins)
cameraRouter.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'user' && req.user.assignedCameras?.length) {
      filter._id = { $in: req.user.assignedCameras };
    }
    const cameras = await Camera.find(filter).lean();
    res.json({ success: true, data: cameras });
  } catch (err) { next(err); }
});

// Update camera status (used by AI service heartbeat)
cameraRouter.put('/:cameraId/status', async (req, res, next) => {
  try {
    const camera = await Camera.findOneAndUpdate(
      { cameraId: req.params.cameraId },
      { status: req.body.status, lastSeen: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: camera });
  } catch (err) { next(err); }
});

// Simulate alert for demo/testing
cameraRouter.post('/:cameraId/simulate', async (req, res, next) => {
  try {
    const { type = 'fight', confidence = 0.85 } = req.body;
    const camera = await Camera.findOne({ cameraId: req.params.cameraId });

    const mockAlert = {
      id: 'sim-' + Date.now(),
      type,
      severity: confidence > 0.8 ? 'high' : 'medium',
      confidence,
      camera: {
        id: req.params.cameraId,
        name: camera?.name || `Camera ${req.params.cameraId}`,
        location: camera?.location || 'Simulation',
      },
      description: `[SIMULATION] ${type} detected with ${(confidence * 100).toFixed(0)}% confidence`,
      detectedAt: new Date(),
    };

    broadcastAlert(mockAlert);
    res.json({ success: true, message: 'Simulation triggered', alert: mockAlert });
  } catch (err) { next(err); }
});

module.exports = cameraRouter;

// ─── Analytics Routes ─────────────────────────────────────────────────────────
const analyticsRouter = express.Router();
const Alert = require('../models/Alert');

analyticsRouter.use(protect);

analyticsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      todayAlerts, yesterdayAlerts, weekAlerts,
      activeAlerts, byType, trend
    ] = await Promise.all([
      Alert.countDocuments({ detectedAt: { $gte: today } }),
      Alert.countDocuments({ detectedAt: { $gte: yesterday, $lt: today } }),
      Alert.countDocuments({ detectedAt: { $gte: weekAgo } }),
      Alert.countDocuments({ status: 'active' }),
      Alert.aggregate([
        { $match: { detectedAt: { $gte: weekAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { detectedAt: { $gte: weekAgo }, type: { $ne: 'normal' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
            total: { $sum: 1 },
            fights: { $sum: { $cond: [{ $eq: ['$type', 'fight'] }, 1, 0] } },
            falls: { $sum: { $cond: [{ $eq: ['$type', 'fall'] }, 1, 0] } },
            anomalies: { $sum: { $cond: [{ $eq: ['$type', 'crowd_anomaly'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const changeFromYesterday = yesterdayAlerts > 0
      ? (((todayAlerts - yesterdayAlerts) / yesterdayAlerts) * 100).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        today: todayAlerts,
        yesterday: yesterdayAlerts,
        weekTotal: weekAlerts,
        activeAlerts,
        changeFromYesterday,
        byType,
        trend,
      },
    });
  } catch (err) { next(err); }
});

module.exports = { cameraRouter, analyticsRouter };
