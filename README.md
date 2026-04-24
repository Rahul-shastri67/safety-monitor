# 🛡️ SafeWatch AI

AI-powered real-time safety monitoring system built with **MERN + FastAPI + Socket.io** for detecting incidents like **Fight, Fall, Crowd Anomaly** and generating instant alerts.

![MERN](https://img.shields.io/badge/Stack-MERN-blue)
![AI](https://img.shields.io/badge/AI-FastAPI-green)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

* 🔐 JWT Authentication & Role-Based Access
* 📡 Real-Time Alerts using Socket.io
* 🤖 AI Incident Detection (Fight/Fall/Crowd)
* 📹 Video Upload + Webcam Monitoring
* 📊 Analytics Dashboard
* 📋 Incident History & Alert Management
* 👑 Admin Panel for Users & Cameras
* 🐳 Docker Ready Deployment

---

## 🛠 Tech Stack

**Frontend:** React, Tailwind CSS
**Backend:** Node.js, Express.js
**Database:** MongoDB
**AI Service:** FastAPI, Python
**Realtime:** Socket.io
**Auth:** JWT, bcrypt

---

## 📂 Project Structure

```bash
safety-monitor/
├── client/
├── server/
├── ai-service/
└── README.md
```

---

## ⚡ Setup

```bash
git clone https://github.com/yourusername/safety-monitor.git
cd safety-monitor

# Install
npm install
cd server && npm install
cd ../client && npm install
```

Create `server/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
AI_SERVICE_URL=http://localhost:8000
```

Run project:

```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev

# AI Service
cd ai-service
uvicorn main:app --reload --port 8000
```

---

## 🔌 Core Modules

* Authentication System
* AI Detection Engine
* Alert Monitoring Dashboard
* Incident Analytics
* Admin Management
* WebSocket Notification System

---

## 🎯 Detection Types

* Fight Detection
* Fall Detection
* Crowd Anomaly
* Intrusion Detection

---

## 🚀 Future Enhancements

* Live CCTV Streams
* Real AI Model Integration
* Mobile Alerts
* Cloud Deployment

---

## 📸 Screenshots

Add screenshots inside `/screenshots`

```bash
screenshots/dashboard.png
screenshots/alerts.png
```

---

## 👨‍💻 Author

**Rahul Shastri**

GitHub:[ https://github.com/Rahul-shastri67](https://github.com/Rahul-shastri67)

---

⭐ If you like this project, consider giving it a star.
