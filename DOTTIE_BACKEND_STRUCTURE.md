# DOTTIE.YZ Backend (DOTTIE-backend) - Complete Structure Documentation

## Overview

**Type:** Node.js Express REST API  
**Module System:** CommonJS (`require`/`module.exports`)  
**Database:** MySQL (via mysql2)  
**Deployment:** Railway  
**Port:** 5000 (default) or `process.env.PORT`

---

## Directory Structure

```
DOTTIE-backend/
├── server.js                    # Main entry point - Express app configuration
├── package.json                 # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── Procfile                    # Railway deployment command
├── railway.json                # Railway configuration
├── .env.example                # Environment variables template
│
├── config/                     # Configuration files
│   └── cloudinary.js          # Cloudinary image upload config
│
├── controllers/                # Business logic handlers
│   ├── announcementController.js    # Announcements CRUD
│   ├── authController.js            # Authentication (login, signup, Google OAuth)
│   ├── contactController.js         # Contact form submissions
│   ├── dropController.js            # Product drops management
│   ├── notificationController.js    # User notifications
│   ├── orderController.js           # Order processing
│   ├── productController.js         # Product CRUD
│   ├── reservationController.js     # Product reservations
│   ├── settingsController.js        # App settings
│   └── storeConfigController.js     # Store mode (open/reservation)
│
├── db/                         # Database files
│   ├── connection.js          # MySQL connection pool
│   ├── auth_schema.sql        # Users table schema
│   ├── announcements_schema.sql    # Announcements table
│   ├── contact_messages.sql        # Contact messages table
│   ├── notifications.sql           # Notifications table
│   ├── migration_*.sql             # Database migrations
│   ├── fix_reservations.sql        # Reservation fixes
│   └── backend_bridge_fix.sql      # Schema fixes
│
├── middleware/                 # Express middleware
│   ├── authMiddleware.js      # JWT authentication & admin verification
│   ├── cookieParser.js        # Cookie parsing
│   ├── errorHandler.js        # Global error handler
│   └── storeModeMiddleware.js # Store mode protection
│
├── models/                     # Data models (MySQL queries)
│   ├── announcement.js        # Announcement model
│   ├── contactMessage.js      # Contact message model
│   ├── drop.js                # Drop model
│   ├── notification.js        # Notification model
│   ├── order.js               # Order model
│   ├── orderItem.js           # Order items model
│   ├── passwordReset.js       # Password reset tokens
│   ├── product.js             # Product model
│   ├── settings.js            # Settings model
│   └── user.js                # User model
│
├── routes/                     # API route definitions
│   ├── announcementRoutes.js  # /api/admin/announcement
│   ├── authRoutes.js          # /api/auth
│   ├── contactRoutes.js       # /api/admin/messages
│   ├── dropRoutes.js          # /api/drops, /api/admin/drops
│   ├── notificationRoutes.js  # /api/admin/notifications
│   ├── orderRoutes.js         # /api/orders, /api/admin/orders
│   ├── productRoutes.js       # /api/products, /api/admin/products
│   ├── settingsRoutes.js      # /api/admin/settings
│   └── upload.js              # /api/upload (Cloudinary)
│
├── utils/                      # Utility functions
│   └── email.js               # Email sending (Nodemailer)
│
├── uploads/                    # Local file uploads (if not using Cloudinary)
│   └── [various image files]
│
└── [utility scripts]           # Database setup/maintenance scripts
    ├── check-schema.js
    ├── fix-table.js
    ├── run-reservation-fix.js
    ├── setup-announcements.js
    ├── setup-simple.js
    ├── test-api.js
    └── test-increment.js
```

---

## Core Files

### 1. server.js (Main Entry Point)

**Purpose:** Express app configuration and route mounting  
**Lines:** 104 lines  
**Key Features:**
- CORS configuration (allows all origins)
- Body parsing (JSON, URL-encoded)
- Cookie parsing
- Store mode middleware
- Route mounting for all API endpoints
- Error handling
- Server startup on port 5000

**Route Structure:**
```javascript
// Public Routes
app.use('/api/auth', authRoutes);                    // Login, signup, Google OAuth
app.use('/api/products', productRoutes);             // Get products
app.use('/api/drops', dropRoutes);                   // Get drops
app.get('/api/store-config', ...);                   // Get store mode
app.get('/api/announcement', ...);                   // Get latest announcement
app.post('/api/reserve', protect, ...);              // Create reservation (auth required)
app.get('/api/reservations/me', protect, ...);       // Get user reservations
app.post('/api/contact', ...);                       // Contact form

// Protected User Routes
app.use('/api/orders', protect, orderRoutes);        // User orders
app.use('/api/upload', protect, uploadRoutes);       // Image uploads

// Admin Only Routes
app.use('/api/admin/drops', verifyAdmin, dropRoutes);
app.use('/api/admin/products', verifyAdmin, productRoutes);
app.use('/api/admin/settings', verifyAdmin, settingsRoutes);
app.use('/api/admin/announcement', verifyAdmin, announcementRoutes);
app.use('/api/admin/orders', verifyAdmin, orderRoutes);
app.use('/api/admin/store-config', verifyAdmin, ...);
app.use('/api/admin/reservations', verifyAdmin, ...);
app.use('/api/admin/messages', verifyAdmin, contactRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/auth-verify', verifyAdmin, ...);
```

---

### 2. package.json

**Dependencies:**
```json
{
  "bcryptjs": "^3.0.3",           // Password hashing
  "cloudinary": "^2.9.0",         // Image hosting
  "cors": "^2.8.6",               // -origin requests
  "dotenv": "^17.3.1",            // Environment variables
  "express": "^5.2.1",            // Web framework
  "google-auth-library": "^10.5.0", // Google OAuth
  "jsonwebtoken": "^9.0.3",       // JWT authentication
  "multer": "^2.0.2",             // File uploads
  "mysql2": "^3.17.1",            // MySQL database
  "nodemailer": "^8.0.1"          // Email sending
}
```

**Scripts:**
```json
{
  "start": "node server.js",      // Production
  "dev": "nodemon server.js"      // Development with auto-reload
}
```

---

### 3. Railway Configuration

**Procfile:**
```
web: node server.js
```

**railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "nixpacksPlan": {
      "providers": ["nodejs"],
      "phases": {
        "setup": {
          "nixpacksPkgs": ["nodejs_20"]
        }
      }
    }
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### 4. Environment Variables (.env.example)

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Admin
ADMIN_EMAIL=admin@example.com
```

---

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/api/auth/login` | User login | authController.login |
| POST | `/api/auth/signup` | User registration | authController.signup |
| POST | `/api/auth/google` | Google OAuth login | authController.googleLogin |
| POST | `/api/auth/forgot-password` | Request password reset | authController.forgotPassword |
| POST | `/api/auth/reset-password` | Reset password with token | authController.resetPassword |
| GET | `/api/products` | Get all products | productController.getProducts |
| GET | `/api/products/:id` | Get single product | productController.getProduct |
| GET | `/api/drops` | Get all drops | dropController.getDrops |
| GET | `/api/drops/:id` | Get single drop | dropController.getDrop |
| GET | `/api/store-config` | Get store mode | storeConfigController.getStoreConfig |
| GET | `/api/announcement` | Get latest announcement | announcementController.getLatestAnnouncement |
| POST | `/api/contact` | Submit contact form | Inline in server.js |

### Protected User Endpoints (Auth Required)

| Method | Endpoint | Description | Middleware |
|--------|----------|-------------|------------|
| POST | `/api/reserve` | Create product reservation | protect |
| GET | `/api/reservations/me` | Get user's reservations | protect |
| POST | `/api/orders/order` | Create order | protect |
| GET | `/api/orders/me` | Get user's orders | protect |
| POST | `/api/upload` | Upload image to Cloudinary | protect |

### Admin Endpoints (Admin Auth Required)

| Method | Endpoint | Description | Middleware |
|--------|----------|-------------|------------|
| GET | `/api/admin/auth-verify` | Verify admin session | verifyAdmin |
| GET | `/api/admin/drops` | Get all drops (admin) | verifyAdmin |
| POST | `/api/admin/drops` | Create drop | verifyAdmin |
| PUT | `/api/admin/drops/:id` | Update drop | verifyAdmin |
| DELETE | `/api/admin/drops/:id` | Delete drop | verifyAdmin |
| GET | `/api/admin/products` | Get all products (admin) | verifyAdmin |
| POST | `/api/admin/products` | Create product | verifyAdmin |
| PUT | `/api/admin/products/:id` | Update product | verifyAdmin |
| DELETE | `/api/admin/products/:id` | Delete product | verifyAdmin |
| GET | `/api/admin/settings` | Get settings | verifyAdmin |
| PUT | `/api/admin/settings` | Update settings | verifyAdmin |
| GET | `/api/admin/announcement` | Get announcements | verifyAdmin |
| POST | `/api/admin/announcement` | Create announcement | verifyAdmin |
| PUT | `/api/admin/announcement/:id` | Update announcement | verifyAdmin |
| DELETE | `/api/admin/announcement/:id` | Delete announcement | verifyAdmin |
| GET | `/api/admin/orders` | Get all orders | verifyAdmin |
| GET | `/api/admin/store-config` | Get store config | verifyAdmin |
| PUT | `/api/admin/store-config` | Update store mode | verifyAdmin |
| GET | `/api/admin/reservations` | Get all reservations | verifyAdmin |
| PATCH | `/api/admin/reservations/:id/status` | Update reservation status | verifyAdmin |
| GET | `/api/admin/messages` | Get contact messages | verifyAdmin |
| GET | `/api/admin/notifications` | Get notifications | verifyAdmin |

---

## Database Schema

### Tables

1. **users** - User accounts
   - id, name, email, password (hashed), created_at

2. **products** - Product catalog
   - id, name, description, price, image_url, sizes, stock, drop_id, created_at

3. **drops** - Product collections/releases
   - id, name, description, release_date, is_active, created_at

4. **orders** - Customer orders
   - id, user_id, customer_name, customer_email, phone, total_amount, status, created_at

5. **order_items** - Order line items
   - id, order_id, product_id, quantity, price, size

6. **reservations** - Product reservations
   - id, user_id, product_id, size, quantity, status, created_at

7. **announcements** - Site-wide announcements
   - id, title, message, type, is_active, created_at

8. **contact_messages** - Contact form submissions
   - id, name, email, subject, message, created_at

9. **notifications** - User notifications
   - id, user_id, message, type, is_read, created_at

10. **settings** - App configuration
    - id, key, value

11. **password_resets** - Password reset tokens
    - id, user_id, token, expires_at, created_at

---

## Middleware

### 1. authMiddleware.js

**Functions:**
- `protect(req, res, next)` - Verifies JWT token from Authorization header
- `verifyAdmin(req, res, next)` - Checks if user email matches ADMIN_EMAIL

**Usage:**
```javascript
// Protect route - requires valid JWT
app.get('/api/orders/me', protect, orderController.getMyOrders);

// Admin only - requires valid JWT + admin email
app.get('/api/admin/orders', verifyAdmin, orderController.getAllOrders);
```

### 2. storeModeMiddleware.js

**Purpose:** Blocks order creation when store is in "reservation" mode

**Usage:**
```javascript
app.use(checkStoreMode); // Applied globally in server.js
```

### 3. cookieParser.js

**Purpose:** Parses cookies from request headers

### 4. errorHandler.js

**Purpose:** Global error handler for Express

---

## Controllers

### authController.js (7,991 bytes)

**Functions:**
- `login(req, res)` - Email/password authentication
- `signup(req, res)` - User registration
- `googleLogin(req, res)` - Google OAuth authentication
- `forgotPassword(req, res)` - Send password reset email
- `resetPassword(req, res)` - Reset password with token
- `logout(req, res)` - Clear session (if using cookies)

### productController.js (1,871 bytes)

**Functions:**
- `getProducts(req, res)` - Get all products
- `getProduct(req, res)` - Get single product by ID
- `createProduct(req, res)` - Create new product (admin)
- `updateProduct(req, res)` - Update product (admin)
- `deleteProduct(req, res)` - Delete product (admin)

### dropController.js (2,874 bytes)

**Functions:**
- `getDrops(req, res)` - Get all drops (with optional products)
- `getDrop(req, res)` - Get single drop by ID
- `createDrop(req, res)` - Create new drop (admin)
- `updateDrop(req, res)` - Update drop (admin)
- `deleteDrop(req, res)` - Delete drop (admin)

### orderController.js (1,790 bytes)

**Functions:**
- `createOrder(req, res)` - Create new order
- `getMyOrders(req, res)` - Get user's orders
- `getAllOrders(req, res)` - Get all orders (admin)

### reservationController.js (4,240 bytes)

**Functions:**
- `createReservation(req, res)` - Create product reservation
- `getReservations(req, res)` - Get reservations (user or admin)
- `updateReservationStatus(req, res)` - Update status (admin)

### announcementController.js (2,083 bytes)

**Functions:**
- `getLatestAnnouncement(req, res)` - Get active announcement
- `getAnnouncements(req, res)` - Get all announcements (admin)
- `createAnnouncement(req, res)` - Create announcement (admin)
- `updateAnnouncement(req, res)` - Update announcement (admin)
- `deleteAnnouncement(req, res)` - Delete announcement (admin)

### contactController.js (3,564 bytes)

**Functions:**
- `getMessages(req, res)` - Get all contact messages (admin)
- `getMessage(req, res)` - Get single message (admin)
- `deleteMessage(req, res)` - Delete message (admin)

### storeConfigController.js (1,264 bytes)

**Functions:**
- `getStoreConfig(req, res)` - Get store mode (open/reservation)
- `updateStoreConfig(req, res)` - Update store mode (admin)

### settingsController.js (677 bytes)

**Functions:**
- `getSettings(req, res)` - Get app settings
- `updateSettings(req, res)` - Update settings (admin)

### notificationController.js (2,241 bytes)

**Functions:**
- `getNotifications(req, res)` - Get user notifications
- `markAsRead(req, res)` - Mark notification as read
- `deleteNotification(req, res)` - Delete notification

---

## Models (Database Queries)

All models use `mysql2` with connection pool from `db/connection.js`

**Pattern:**
```javascript
const pool = require('../db/connection');

const Model = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM table');
    return rows;
  },
  
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM table WHERE id = ?', [id]);
    return rows[0];
  },
  
  async create(data) {
    const [result] = await pool.query('INSERT INTO table SET ?', [data]);
    return result.insertId;
  },
  
  async update(id, data) {
    await pool.query('UPDATE table SET ? WHERE id = ?', [data, id]);
  },
  
  async delete(id) {
    await pool.query('DELETE FROM table WHERE id = ?', [id]);
  }
};

module.exports = Model;
```

---

## Utilities

### email.js (3,020 bytes)

**Purpose:** Send emails using Nodemailer

**Functions:**
- `sendPasswordResetEmail(email, token)` - Send password reset link
- `sendOrderConfirmation(email, orderDetails)` - Send order confirmation
- `sendReservationConfirmation(email, reservationDetails)` - Send reservation confirmation

**Configuration:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### cloudinary.js (250 bytes)

**Purpose:** Configure Cloudinary for image uploads

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

---

## Deployment to Railway

### Prerequisites
1. Railway account
2. MySQL database (Railway provides this)
3. GitHub repository

### Steps

1. **Create Railway Project**
   ```bash
   # Option 1: Railway CLI
   railway init
   railway link
   
   # Option 2: Railway Dashboard
   # - Go to railway.app
   # - Click "New Project"
   # - Select "Deploy from GitHub repo"
   # - Choose your repository
   # - Set root directory to "DOTTIE-backend"
   ```

2. **Add MySQL Database**
   ```bash
   # Railway Dashboard
   # - Click "New" → "Database" → "Add MySQL"
   # - Railway will provide DATABASE_URL automatically
   ```

3. **Set Environment Variables**
   ```bash
   # Railway Dashboard → Variables
   DATABASE_URL=<provided by Railway>
   JWT_SECRET=your-secret-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   GOOGLE_CLIENT_ID=your-google-client-id
   ADMIN_EMAIL=admin@example.com
   ```

4. **Deploy**
   ```bash
   # Railway will auto-deploy on git push
   git add .
   git commit -m "Deploy backend"
   git push origin main
   ```

5. **Run Database Migrations**
   ```bash
   # Connect to Railway MySQL and run SQL files
   # Or use Railway CLI:
   railway run node setup-simple.js
   ```

6. **Get Deployment URL**
   ```bash
   # Railway Dashboard → Settings → Domains
   # Example: https://DOTTIE-backend-production.up.railway.app
   ```

7. **Update Vercel Configuration**
   ```json
   // vercel.json
   {
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "https://your-railway-url.railway.app/api/$1"
       }
     ]
   }
   ```

---

## Testing

### Local Development

```bash
# 1. Install dependencies
cd DOTTIE-backend
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 3. Start MySQL locally or use Railway database

# 4. Run migrations
node setup-simple.js

# 5. Start server
npm run dev

# Server runs on http://localhost:5000
```

### Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/store-config

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Get products
curl http://localhost:5000/api/products

# Get drops
curl http://localhost:5000/api/drops
```

---

## Common Issues & Solutions

### Issue 1: 404 on all routes
**Cause:** Backend not deployed or wrong URL  
**Solution:** Check Railway deployment status and update vercel.json

### Issue 2: Database connection error
**Cause:** DATABASE_URL not set or incorrect  
**Solution:** Verify environment variable in Railway dashboard

### Issue 3: CORS errors
**Cause:** Frontend domain not allowed  
**Solution:** Backend already allows all origins, check browser console

### Issue 4: JWT authentication fails
**Cause:** JWT_SECRET not set or token expired  
**Solution:** Set JWT_SECRET in Railway, check token expiration

### Issue 5: Image upload fails
**Cause:** Cloudinary credentials not set  
**Solution:** Set CLOUDINARY_* variables in Railway

---

## File Size Summary

| Category | Files | Total Size |
|----------|-------|------------|
| Controllers | 10 | ~33 KB |
| Models | 10 | ~14 KB |
| Routes | 9 | ~5 KB |
| Middleware | 4 | ~4 KB |
| Database | 11 | ~9 KB |
| Utils | 2 | ~3 KB |
| Config | 1 | ~250 bytes |
| Main | 1 (server.js) | ~4 KB |
| **Total** | **48 files** | **~72 KB** |

---

## Next Steps

1. ✅ Verify Railway deployment
2. ✅ Check DATABASE_URL is set
3. ✅ Run database migrations
4. ✅ Test API endpoints
5. ✅ Update vercel.json with correct Railway URL
6. ✅ Deploy frontend to Vercel
7. ✅ Test end-to-end integration

---

## Support

For issues:
1. Check Railway deployment logs
2. Check database connection
3. Verify environment variables
4. Test endpoints with curl/Postman
5. Check browser console for errors
