# 🔐 Mini Secure User Management System

A production-style secure user management system built with **Node.js**, **Express**, **MongoDB**, **Redis**, and **WebSocket**.

---

## 🚀 Features

- ✅ JWT Authentication (Access Token + Refresh Token)
- ✅ Refresh Token Blacklisting via Redis
- ✅ Role-Based Access Control (Admin / User)
- ✅ Full User CRUD with Pagination & Search
- ✅ Real-time Notifications via WebSocket (JWT authenticated)
- ✅ Winston Logging (file + console)
- ✅ Redis-backed API Rate Limiting
- ✅ Centralized Error Handling
- ✅ Swagger API Documentation
- ✅ Helmet security headers
- ✅ Environment variable configuration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Cache / Rate Limit | Redis + ioredis |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| WebSocket | Socket.io |
| Logging | Winston + Morgan |
| Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Validation | Joi |

---

## 📁 Project Structure

```
user-management-system/
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   ├── redis.js          # Redis client
│   │   ├── logger.js         # Winston logger
│   │   └── swagger.js        # Swagger config
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT protect
│   │   ├── role.middleware.js       # Role authorization
│   │   ├── rateLimiter.middleware.js # Redis rate limiter
│   │   └── error.middleware.js      # Centralized error handler
│   ├── models/
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   └── user.service.js
│   ├── socket/
│   │   └── socket.js         # WebSocket with JWT auth
│   ├── utils/
│   │   └── response.js       # Standardized responses
│   └── app.js
├── logs/
│   ├── combined.log
│   └── error.log
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 16
- MongoDB (local or Atlas)
- Redis (local or cloud)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/user-management-system.git
cd user-management-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/user_management
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 4. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

### 5. Access Swagger Docs
```
http://localhost:5000/api-docs
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login (rate limited) | Public |
| POST | `/api/auth/refresh-token` | Refresh tokens (rate limited) | Public |
| POST | `/api/auth/logout` | Logout & blacklist token | 🔒 Required |
| GET | `/api/auth/profile` | Get own profile | 🔒 Required |

### User Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users (paginated) | 👑 Admin |
| POST | `/api/users` | Create user | 👑 Admin |
| GET | `/api/users/:id` | Get user by ID | 👑 Admin |
| PATCH | `/api/users/:id` | Update user | 👑 Admin |
| DELETE | `/api/users/:id` | Delete user | 👑 Admin |
| PATCH | `/api/users/me` | Update own profile | 🔒 Any user |

---

## ⚡ WebSocket Events

Connect with JWT token:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log(data);
  // { type: 'USER_CREATED', message: '...', timestamp: '...' }
});
```

### Notification Types
| Event | Trigger |
|-------|---------|
| `USER_LOGIN` | Successful login |
| `USER_CREATED` | Admin creates a user |
| `USER_UPDATED` | Admin updates a user |
| `USER_DELETED` | Admin deletes a user |

---

## 🚦 Rate Limiting

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| `POST /api/auth/login` | 15 min | 10 |
| `POST /api/auth/refresh-token` | 15 min | 20 |

Returns `429 Too Many Requests` when exceeded.

---

## 📝 Logging

Logs are stored in:
- `logs/combined.log` — All logs
- `logs/error.log` — Error logs only

Log levels: `error`, `warn`, `info`, `http`, `debug`

Each log includes: `timestamp`, `level`, `message`, and metadata.

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- JWT secrets stored in **environment variables**
- Refresh tokens **blacklisted on logout** (Redis)
- **Helmet** for HTTP security headers
- **Role-based** route protection
- Input validation on all endpoints

---

## 📮 API Documentation

Full Swagger UI available at: `http://localhost:5000/api-docs`

---

## 🏗️ Creating First Admin User

After starting the server, register normally then update role via MongoDB:
```javascript
// In MongoDB shell or Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```
