/**
 * Analytics Routes
 */
const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Camera = require('../models/Camera');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─── @GET /api/analytics/dashboard ───────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayAlerts, yesterdayAlerts, weekAlerts, activeAlerts, byType, trend] =
      await Promise.all([
        Alert.countDocuments({ detectedAt: { $gte: today } }),
        Alert.countDocuments({ detectedAt: { $gte: yesterday, $lt: today } }),
        Alert.countDocuments({ detectedAt: { $gte: weekAgo } }),
        Alert.countDocuments({ status: 'active' }),
        Alert.aggregate([
          { $match: { detectedAt: { $gte: weekAgo } } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Alert.aggregate([
          {
            $match: {
              detectedAt: { $gte: weekAgo },
              type: { $ne: 'normal' },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
              total: { $sum: 1 },
              fights: { $sum: { $cond: [{ $eq: ['$type', 'fight'] }, 1, 0] } },
              falls: { $sum: { $cond: [{ $eq: ['$type', 'fall'] }, 1, 0] } },
              anomalies: {
                $sum: { $cond: [{ $eq: ['$type', 'crowd_anomaly'] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const changeFromYesterday =
      yesterdayAlerts > 0
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
  } catch (err) {
    next(err);
  }
});

// ─── @GET /api/analytics/heatmap ─────────────────────────────────────────────
router.get('/heatmap', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const heatmap = await Alert.aggregate([
      { $match: { detectedAt: { $gte: since }, type: { $ne: 'normal' } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$detectedAt' },
            dayOfWeek: { $dayOfWeek: '$detectedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    res.json({ success: true, data: heatmap });
  } catch (err) {
    next(err);
  }
});

// ─── @GET /api/analytics/camera-stats ────────────────────────────────────────
router.get('/camera-stats', async (req, res, next) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: '$camera.id',
          cameraName: { $first: '$camera.name' },
          location: { $first: '$camera.location' },
          totalAlerts: { $sum: 1 },
          fights: { $sum: { $cond: [{ $eq: ['$type', 'fight'] }, 1, 0] } },
          falls: { $sum: { $cond: [{ $eq: ['$type', 'fall'] }, 1, 0] } },
          anomalies: {
            $sum: { $cond: [{ $eq: ['$type', 'crowd_anomaly'] }, 1, 0] },
          },
          avgConfidence: { $avg: '$confidence' },
          lastAlert: { $max: '$detectedAt' },
        },
      },
      { $sort: { totalAlerts: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
