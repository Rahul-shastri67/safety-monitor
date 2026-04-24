/**
 * Admin Controller - System Management
 */

const User = require('../models/User');
const Alert = require('../models/Alert');
const Camera = require('../models/Camera');
const logger = require('../utils/logger');

// ─── @GET /api/admin/users ────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/admin/users/:id ────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updateData = {};
    if (role) updateData.role = role;
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`Admin ${req.user.email} updated user ${user.email}: ${JSON.stringify(updateData)}`);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── @DELETE /api/admin/users/:id ─────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`Admin ${req.user.email} deleted user ${user.email}`);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/admin/cameras ──────────────────────────────────────────────────
exports.getAllCameras = async (req, res, next) => {
  try {
    const cameras = await Camera.find().sort('-createdAt').populate('assignedOperators', 'name email').lean();
    res.status(200).json({ success: true, data: cameras });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/admin/cameras ─────────────────────────────────────────────────
exports.createCamera = async (req, res, next) => {
  try {
    const camera = await Camera.create(req.body);
    logger.info(`Camera created: ${camera.cameraId} by ${req.user.email}`);
    res.status(201).json({ success: true, data: camera });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/admin/cameras/:id ─────────────────────────────────────────────
exports.updateCamera = async (req, res, next) => {
  try {
    const camera = await Camera.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });
    res.status(200).json({ success: true, data: camera });
  } catch (error) {
    next(error);
  }
};

// ─── @DELETE /api/admin/cameras/:id ──────────────────────────────────────────
exports.deleteCamera = async (req, res, next) => {
  try {
    const camera = await Camera.findByIdAndDelete(req.params.id);
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });
    res.status(200).json({ success: true, message: 'Camera deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/admin/system-stats ────────────────────────────────────────────
exports.getSystemStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalAlerts,
      alertsToday,
      activeAlerts,
      totalCameras,
      onlineCameras,
      alertsByType,
      alertsByDay,
    ] = await Promise.all([
      User.countDocuments(),
      Alert.countDocuments(),
      Alert.countDocuments({ detectedAt: { $gte: today } }),
      Alert.countDocuments({ status: 'active' }),
      Camera.countDocuments(),
      Camera.countDocuments({ status: 'online' }),
      Alert.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        {
          $match: {
            detectedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
            count: { $sum: 1 },
            fights: { $sum: { $cond: [{ $eq: ['$type', 'fight'] }, 1, 0] } },
            falls: { $sum: { $cond: [{ $eq: ['$type', 'fall'] }, 1, 0] } },
            anomalies: { $sum: { $cond: [{ $eq: ['$type', 'crowd_anomaly'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAlerts,
          alertsToday,
          activeAlerts,
          totalCameras,
          onlineCameras,
          offlineCameras: totalCameras - onlineCameras,
        },
        alertsByType,
        alertsByDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @DELETE /api/admin/alerts/bulk ──────────────────────────────────────────
exports.bulkDeleteAlerts = async (req, res, next) => {
  try {
    const { ids, olderThan } = req.body;
    const filter = {};

    if (ids && ids.length > 0) {
      filter._id = { $in: ids };
    } else if (olderThan) {
      filter.detectedAt = { $lt: new Date(olderThan) };
    } else {
      return res.status(400).json({ success: false, message: 'Provide ids or olderThan' });
    }

    const result = await Alert.deleteMany(filter);
    logger.info(`Admin ${req.user.email} bulk deleted ${result.deletedCount} alerts`);
    res.status(200).json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
};
