const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const alertController = require('../controllers/alertController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Multer config for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `video-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|avi|mov|mkv|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype.startsWith('video/');
    if (ext || mime) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  },
});

router.get('/', protect, alertController.getAlerts);
router.get('/stats/summary', protect, alertController.getAlertStats);
router.get('/:id', protect, alertController.getAlertById);
router.post('/detect', protect, alertController.detectAndCreateAlert);
router.post('/upload-detect', protect, uploadLimiter, upload.single('video'), alertController.detectFromUpload);
router.put('/:id/acknowledge', protect, alertController.acknowledgeAlert);
router.put('/:id/resolve', protect, restrictTo('admin', 'operator'), alertController.resolveAlert);

module.exports = router;
