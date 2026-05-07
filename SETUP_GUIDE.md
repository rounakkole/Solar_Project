# 🌞 Solar Panel Project - Setup Guide

## ✅ What Was Fixed

1. **Database Connection Issue** - Added proper database pool export and initialization
2. **Server Startup** - Now tests database connection before starting server
3. **Route Registration** - All API routes are now properly registered
4. **Error Handling** - Better error messages for database troubleshooting
5. **MySQL Port** - Changed from 3307 to standard 3306

---

## 📋 Prerequisites

Make sure you have installed:
- **Node.js** (v14+) - [Download](https://nodejs.org/)
- **MySQL** (v5.7+) - [Download](https://dev.mysql.com/downloads/mysql/)
- **npm** (comes with Node.js)

---

## 🚀 Installation Steps

### Step 1: Setup MySQL Database

#### On Windows:
```bash
# Open Command Prompt or PowerShell as Administrator
mysql -u root

# In MySQL terminal:
CREATE DATABASE solar_db;
EXIT;

# Import database structure:
mysql -u root solar_db < solar_database.sql
```

#### On macOS/Linux:
```bash
# Open Terminal
mysql -u root -p

# When prompted, enter your MySQL password (or press Enter if no password)
# In MySQL terminal:
CREATE DATABASE solar_db;
EXIT;

# Import database structure:
mysql -u root -p solar_db < solar_database.sql
```

### Step 2: Setup Backend

```bash
cd solar-backend

# Install dependencies
npm install

# Check if database connects (optional - server will test on startup)
# npm run db:init (if you want to reimport the database)

# Start the server
npm run dev
```

**Expected Output:**
```
🚀 Starting Solar Panel Backend Server...

📦 Database Configuration:
   Host: localhost
   Port: 3306
   User: root
   Database: solar_db

🔗 Testing Database Connection...
✅ MySQL Connected Successfully!
✅ Database: solar_db

✅ Server Status: ONLINE
📍 Server running on http://localhost:5000
🔍 Health check: http://localhost:5000/api/health
🌐 Frontend URL: http://localhost:3000
📊 Database: solar_db

🚀 All systems operational!
```

### Step 3: Setup Frontend

In a **new terminal** window:

```bash
cd solar-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 🔗 API Endpoints

After setup, you can test the API:

### Health Check (No Database needed)
```
GET http://localhost:5000/api/health
```

### Products (Requires Database)
```
GET http://localhost:5000/api/products
```

### Other Endpoints
- `GET /api/products` - Get all products
- `POST /api/cart` - Add to cart
- `GET /api/orders` - Get orders
- `POST /api/payments` - Process payment
- And more...

---

## 🐛 Troubleshooting

### ❌ Error: "EADDRINUSE: address already in use :::5000"
**Solution:** Port 5000 is already in use.
```bash
# Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

### ❌ Error: "ENOENT: no such file or directory, open '.env'"
**Solution:** The .env file is already in the project. Make sure you're in the correct directory.
```bash
cd solar-backend
ls -la .env  # Should show the file
```

### ❌ Error: "ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'"
**Solution:** MySQL password is wrong or user doesn't exist.
```bash
# Update .env with correct credentials
nano .env
# Edit DB_USER and DB_PASSWORD
```

### ❌ Error: "ER_BAD_DB_ERROR: Unknown database 'solar_db'"
**Solution:** Database doesn't exist yet.
```bash
# Create the database
mysql -u root -e "CREATE DATABASE solar_db;"

# If using a password:
mysql -u root -p -e "CREATE DATABASE solar_db;"

# Import the schema
mysql -u root solar_db < solar_database.sql
```

### ❌ Error: "Can't connect to MySQL server on 'localhost:3306'"
**Solution:** MySQL is not running.

**Windows:** Start MySQL from Services
```bash
services.msc  # Search and start "MySQL80" service
```

**macOS:**
```bash
brew services start mysql
```

**Linux:**
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

### ❌ Frontend can't connect to backend
**Solution:** Make sure backend is running on port 5000 and CORS is configured.
Check `.env` in backend has:
```
FRONTEND_URL=http://localhost:5173
```

---

## 📁 Project Structure

```
solar-project/
├── solar-backend/          # Node.js Express API
│   ├── config/
│   │   ├── db.js          # ✅ FIXED: Database connection pool
│   │   └── email.js
│   ├── routes/            # API endpoints (already working)
│   ├── middleware/
│   ├── server.js          # ✅ FIXED: Now initializes database
│   ├── .env               # ✅ FIXED: Port 3306
│   └── package.json
│
└── solar-frontend/        # React + Vite
    ├── src/
    ├── vite.config.js
    └── package.json
```

---

## 🔐 Environment Variables

The `.env` file is already configured. Key variables:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=3306              # ✅ FIXED: Changed from 3307
DB_USER=root
DB_PASSWORD=""
DB_NAME=solar_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# Payment (Razorpay - Optional for testing)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Email (Optional)
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## ✅ Testing the Connection

### Test 1: Database Connection
```bash
cd solar-backend
npm run dev
# You should see: ✅ MySQL Connected Successfully!
```

### Test 2: API Health Check
```bash
# In a new terminal, run:
curl http://localhost:5000/api/health

# Expected response:
# {"status":"OK","server":"Running","timestamp":"2024-05-05T..."}
```

### Test 3: Get Products from Database
```bash
curl http://localhost:5000/api/products

# Expected response:
# {"success":true,"count":X,"data":[...]}
```

---

## 🎯 What's Been Fixed

| Issue | Before | After |
|-------|--------|-------|
| Database Pool | ❌ Not exported | ✅ Exported with pool & query helper |
| testConnection | ❌ Never called | ✅ Called on server startup |
| Route Registration | ❌ No routes registered | ✅ All 12 route groups registered |
| Server Init | ❌ Didn't test DB | ✅ Tests DB before listening |
| Error Messages | ❌ Cryptic | ✅ Clear troubleshooting tips |
| MySQL Port | ❌ 3307 (non-standard) | ✅ 3306 (standard) |

---

## 📞 Support

If you still have issues:

1. **Check MySQL is running:** `mysql -u root -e "SELECT 1"`
2. **Check database exists:** `mysql -u root -e "SHOW DATABASES;"`
3. **Check backend logs:** Look for error messages in terminal
4. **Verify .env file:** Make sure credentials match your MySQL setup
5. **Check ports:** Backend should be 5000, Frontend 5173

---

## 🚀 Next Steps

1. ✅ Setup MySQL and database
2. ✅ Run backend with `npm run dev`
3. ✅ Run frontend in another terminal
4. ✅ Open http://localhost:5173
5. 🎉 Enjoy your solar panel application!

---

**Last Updated:** May 5, 2024
**Status:** ✅ All Database Issues Fixed
