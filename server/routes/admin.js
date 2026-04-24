// ─── Admin Routes ─────────────────────────────────────────────────────────────
const express = require('express');
const adminRouter = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

adminRouter.use(protect, restrictTo('admin'));

adminRouter.get('/users', adminController.getAllUsers);
adminRouter.put('/users/:id', adminController.updateUser);
adminRouter.delete('/users/:id', adminController.deleteUser);
adminRouter.get('/cameras', adminController.getAllCameras);
adminRouter.post('/cameras', adminController.createCamera);
adminRouter.put('/cameras/:id', adminController.updateCamera);
adminRouter.delete('/cameras/:id', adminController.deleteCamera);
adminRouter.get('/system-stats', adminController.getSystemStats);
adminRouter.delete('/alerts/bulk', adminController.bulkDeleteAlerts);

module.exports = adminRouter;
