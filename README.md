# 🛡️ SafeWatch — AI-Based Real-Time Safety Monitoring System

> **Portfolio-grade MERN stack project** with real-time WebSocket alerts, role-based access, and AI-powered CCTV incident detection (Fight / Fall / Crowd Anomaly).

![Stack](https://img.shields.io/badge/Stack-MERN-blue) ![AI](https://img.shields.io/badge/AI-Python%20FastAPI-green) ![Realtime](https://img.shields.io/badge/Realtime-Socket.io-orange) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📸 Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Auth** | Secure login/signup with role-based access (Admin / Operator / User) |
| 📡 **Real-Time Alerts** | Socket.io WebSocket alerts broadcast instantly to all connected clients |
| 🤖 **AI Detection** | Python FastAPI service with mock + HuggingFace X-CLIP support |
| 📹 **Video Upload** | Upload MP4/AVI/MOV clips for AI analysis with drag & drop |
| 📷 **Webcam Feed** | Live webcam capture with periodic frame analysis |
| 📊 **Analytics Dashboard** | Recharts-powered trend, distribution, and heatmap charts |
| 📋 **Incident History** | Filterable paginated table with CSV export |
| 👑 **Admin Panel** | User/camera management, system stats, bulk operations |
| 🔔 **Notification System** | In-app toasts, sound alerts, bell dropdown |
| 🐳 **Docker Ready** | Full docker-compose for one-command deployment |

---

## 🗂️ Project Structure

```
safety-monitor/
├── server/                    # Node.js + Express Backend
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── socket.js          # Socket.io initialization + broadcasting
│   ├── controllers/
│   │   ├── authController.js  # JWT auth (login, register, profile)
│   │   ├── alertController.js # AI detection, CRUD, acknowledge/resolve
│   │   └── adminController.js # Admin: users, cameras, system stats
│   ├── middleware/
│   │   ├── auth.js            # JWT verify + role restriction
│   │   ├── errorHandler.js    # Global error handler
│   │   └── rateLimiter.js     # Express rate limiting
│   ├── models/
│   │   ├── User.js            # User schema (bcrypt, JWT, roles)
│   │   ├── Alert.js           # Incident model (type, severity, bboxes)
│   │   └── Camera.js          # CCTV camera registry
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── alerts.js          # /api/alerts/*
│   │   ├── admin.js           # /api/admin/* (protected)
│   │   ├── camera.js          # /api/camera/*
│   │   └── analytics.js       # /api/analytics/*
│   ├── utils/
│   │   ├── logger.js          # Winston logger
│   │   └── alertUtils.js      # Severity helpers, descriptions
│   ├── uploads/               # Video uploads
│   ├── logs/                  # Winston log files
│   ├── server.js              # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── client/                    # React + Tailwind Frontend
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # JWT state, login/logout
│   │   │   └── SocketContext.jsx  # Socket.io + live alerts
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Auth page with demo creds
│   │   │   ├── Register.jsx       # Sign up page
│   │   │   ├── Dashboard.jsx      # Main monitoring dashboard
│   │   │   ├── CameraPage.jsx     # Video upload + webcam
│   │   │   ├── History.jsx        # Incident log with filters
│   │   │   ├── Admin.jsx          # Admin panel
│   │   │   └── Settings.jsx       # User preferences
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Shell with sidebar + topbar
│   │   │   ├── Sidebar.jsx        # Navigation
│   │   │   ├── Topbar.jsx         # Search + notification bell
│   │   │   ├── AlertBadge.jsx     # Reusable type/severity badges
│   │   │   └── ProtectedRoute.jsx # Auth guard
│   │   ├── services/
│   │   │   └── api.js             # Axios with interceptors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── ai-service/                # Python FastAPI AI Service
│   ├── main.py                # Full FastAPI app (mock + HuggingFace + PyTorch)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── model/weights/         # Place .pt model weights here
│
├── docker-compose.yml
├── package.json               # Root with concurrently scripts
├── seed.js                    # Database seeder
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/safety-monitor.git
cd safety-monitor

# Install all dependencies at once
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret

# AI Service
cp ai-service/.env.example ai-service/.env
```

**server/.env** (minimum required):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/safety_monitor
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_here
JWT_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
```

### 3. Seed Database

```bash
# From project root
node seed.js
```

This creates:
- Admin: `admin@safetymonitor.com` / `Admin@123456`
- Operator: `operator@safetymonitor.com` / `Operator@123456`
- User: `user@safetymonitor.com` / `User@123456`
- 6 sample cameras + 120 demo alerts

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev

# Terminal 3: AI Service
cd ai-service && uvicorn main:app --reload --port 8000

# OR use concurrently from root (starts all 3):
npm run dev:all
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Service docs: http://localhost:8000/docs

---

## 🐳 Docker Deployment

```bash
# One command to start everything
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f server

# Stop
docker-compose down
```

---

## ☁️ Cloud Deployment

### Render (Recommended for Free Tier)

**Backend (Web Service):**
1. Connect GitHub repo
2. Root directory: `server`
3. Build: `npm install`
4. Start: `node server.js`
5. Add environment variables from `server/.env.example`

**Frontend (Static Site):**
1. Root directory: `client`
2. Build: `npm install && npm run build`
3. Publish: `dist`
4. Set `VITE_API_URL` to your Render backend URL

**AI Service:**
1. Root directory: `ai-service`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Vercel (Frontend only)

```bash
cd client
npm install -g vercel
vercel --prod
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway up
```

---

## 🤖 AI Service Details

### Current Mode: Mock (Development)
The AI service defaults to `MODEL_TYPE=mock` which generates realistic random predictions without requiring GPU or model weights. Perfect for demos.

### Real Model Integration

**Option 1: HuggingFace X-CLIP (Zero-shot, no training needed)**
```env
MODEL_TYPE=huggingface
HF_MODEL_NAME=microsoft/xclip-base-patch32
```

**Option 2: Custom PyTorch Model**
```env
MODEL_TYPE=pytorch
MODEL_PATH=./model/weights/action_recognition.pt
```
Place your trained `.pt` weights in `ai-service/model/weights/`.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| POST | `/predict` | Analyze single frame (base64) |
| POST | `/predict/video` | Upload & analyze video file |
| POST | `/predict/batch` | Batch frame analysis |
| GET | `/model/info` | Model configuration |
| GET | `/docs` | Swagger UI |

---

## 🔌 Backend API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET  | `/api/auth/me` | ✅ | Current user |
| PUT  | `/api/auth/profile` | ✅ | Update name/notifications |
| PUT  | `/api/auth/change-password` | ✅ | Change password |

### Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/alerts` | ✅ | List with filters + pagination |
| GET  | `/api/alerts/:id` | ✅ | Single alert |
| POST | `/api/alerts/detect` | ✅ | AI detection from frame data |
| POST | `/api/alerts/upload-detect` | ✅ | AI detection from video file |
| PUT  | `/api/alerts/:id/acknowledge` | ✅ | Acknowledge alert |
| PUT  | `/api/alerts/:id/resolve` | ✅ | Resolve / false positive |
| GET  | `/api/alerts/stats/summary` | ✅ | Stats summary |

### Admin (admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/admin/users` | List all users |
| PUT  | `/api/admin/users/:id` | Update role/status |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET  | `/api/admin/cameras` | List cameras |
| POST | `/api/admin/cameras` | Add camera |
| PUT  | `/api/admin/cameras/:id` | Update camera |
| DELETE | `/api/admin/cameras/:id` | Remove camera |
| GET  | `/api/admin/system-stats` | System overview |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | 7-day trend + counts |
| GET | `/api/analytics/heatmap` | Hourly distribution |
| GET | `/api/analytics/camera-stats` | Per-camera breakdown |

---

## 🔴 WebSocket Events

**Client → Server:**
- `join-camera` (cameraId) — subscribe to camera feed
- `leave-camera` (cameraId) — unsubscribe
- `subscribe-alerts` — subscribe to all alerts

**Server → Client:**
- `new-alert` — new incident detected (broadcast to all)
- `admin-alert` — full alert data (admin room only)
- `camera-update` — camera status change
- `stats-update` — live system stats

---

## 🎯 Detection Labels

| Label | Description | Severity Range |
|-------|-------------|----------------|
| `fight` | Physical altercation | High → Critical |
| `fall` | Person fall/collapse | Medium → High |
| `crowd_anomaly` | Unusual crowd behavior | Medium → High |
| `intrusion` | Unauthorized access | High → Critical |
| `normal` | No incident | — |

---

## 🔒 Role Permissions

| Permission | User | Operator | Admin |
|------------|------|----------|-------|
| View dashboard | ✅ | ✅ | ✅ |
| View own alerts | ✅ | ✅ | ✅ |
| Acknowledge alerts | ✅ | ✅ | ✅ |
| Resolve alerts | ❌ | ✅ | ✅ |
| Manage cameras | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View admin panel | ❌ | ❌ | ✅ |

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Socket.io-client |
| Backend | Node.js, Express.js, Socket.io, Mongoose, JWT, Multer |
| Database | MongoDB with Mongoose ODM |
| AI Service | Python 3.11, FastAPI, OpenCV, NumPy, HuggingFace Transformers |
| Auth | JSON Web Tokens (JWT), bcryptjs, express-validator |
| Security | Helmet, CORS, Rate Limiting, Input Validation |
| Logging | Winston (server), Loguru (AI service) |
| Deployment | Docker, docker-compose, Nginx |

---

## 📄 License

MIT License — free to use for portfolio, hackathons, and learning.

---

**Built with ❤️ for the AI Safety Hackathon**
