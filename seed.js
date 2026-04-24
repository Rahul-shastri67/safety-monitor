/**
 * Database Seeder
 * Run: node server/utils/seed.js
 * Seeds admin user, sample cameras, and demo alerts
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');
};

const User   = require('./server/models/User');
const Camera = require('./server/models/Camera');
const Alert  = require('./server/models/Alert');

const CAMERAS = [
  { cameraId: 'cam-01', name: 'Main Entrance',    location: 'Building A Front',  zone: 'Entrance',    status: 'online' },
  { cameraId: 'cam-02', name: 'Corridor B2',       location: 'Block B 2nd Floor', zone: 'Corridor',    status: 'online' },
  { cameraId: 'cam-03', name: 'Cafeteria East',    location: 'Main Cafeteria',    zone: 'Cafeteria',   status: 'online' },
  { cameraId: 'cam-04', name: 'Parking Lot North', location: 'North Parking',     zone: 'Parking',     status: 'offline' },
  { cameraId: 'cam-05', name: 'Library Entry',     location: 'Central Library',   zone: 'Library',     status: 'online' },
  { cameraId: 'cam-06', name: 'Sports Ground',     location: 'Outdoor Field',     zone: 'Sports Ground', status: 'online' },
];

const ALERT_TYPES = ['fight', 'fall', 'crowd_anomaly', 'intrusion', 'normal'];
const SEVERITIES  = ['low', 'medium', 'high', 'critical'];
const STATUSES    = ['active', 'acknowledged', 'resolved'];

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24));
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

async function seed() {
  await connectDB();

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([User.deleteMany({}), Camera.deleteMany({}), Alert.deleteMany({})]);

  // Create admin user
  console.log('👤 Creating admin user...');
  await User.create({
    name:     'Admin User',
    email:    process.env.ADMIN_EMAIL || 'admin@safetymonitor.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role:     'admin',
    isActive: true,
  });

  // Create demo user
  await User.create({
    name:     'Demo User',
    email:    'user@safetymonitor.com',
    password: 'User@123456',
    role:     'user',
    isActive: true,
  });

  // Create operator
  await User.create({
    name:     'Security Operator',
    email:    'operator@safetymonitor.com',
    password: 'Operator@123456',
    role:     'operator',
    isActive: true,
  });

  console.log('✅ Users created');

  // Create cameras
  console.log('📷 Creating cameras...');
  await Camera.insertMany(CAMERAS);
  console.log(`✅ ${CAMERAS.length} cameras created`);

  // Create demo alerts
  console.log('🚨 Creating demo alerts...');
  const alerts = [];
  for (let i = 0; i < 120; i++) {
    const cam  = CAMERAS[Math.floor(Math.random() * CAMERAS.length)];
    const type = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
    const conf = type === 'normal' ? 0.85 + Math.random() * 0.14 : 0.60 + Math.random() * 0.39;
    const sev  = conf > 0.88 ? 'critical' : conf > 0.75 ? 'high' : conf > 0.60 ? 'medium' : 'low';

    alerts.push({
      type,
      severity:   sev,
      confidence: parseFloat(conf.toFixed(4)),
      camera:     { id: cam.cameraId, name: cam.name, location: cam.location },
      description: `${type.replace('_', ' ')} detected at ${cam.name} with ${(conf * 100).toFixed(1)}% confidence`,
      status:     STATUSES[Math.floor(Math.random() * STATUSES.length)],
      detectedAt: randomDate(30),
    });
  }
  await Alert.insertMany(alerts);
  console.log(`✅ ${alerts.length} demo alerts created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:    admin@safetymonitor.com    / Admin@123456');
  console.log('  Operator: operator@safetymonitor.com / Operator@123456');
  console.log('  User:     user@safetymonitor.com     / User@123456');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
