# Solar Panel Installation Website
###  React + Node.js + MySQL

---

## Project Structure

```
solar-project/
├── solar-frontend/          << React (Vite) frontend
│   ├── src/
│   │   ├── components/      << Navbar, Hero, Products, Calculator, Map, Contact, etc.
│   │   ├── pages/           << AdminDashboard
│   │   ├── api/             << axios.js (API calls)
│   │   └── styles/          << global.css
│   └── package.json
│
├── solar-backend/           << Node.js + Express REST API
│   ├── config/
│   │   ├── db.js            << MySQL connection pool
│   │   └── email.js         << Nodemailer email service
│   ├── routes/
│   │   ├── customers.js     << CRUD for customers
│   │   ├── suppliers.js     << CRUD for suppliers
│   │   ├── products.js      << CRUD for products
│   │   ├── orders.js        << Orders + items (transaction)
│   │   ├── installations.js << Installation scheduling
│   │   ├── payments.js      << Payment records
│   │   └── enquiries.js     << Contact form + email notification
│   ├── server.js            << Main Express app
│   └── package.json
│
└── solar-mysql-db.sql       << Full MySQL schema + sample data
```

---

## Setup Instructions

### Step 1 — MySQL Database

1. Install XAMPP / WAMP and start MySQL
2. Open phpMyAdmin or MySQL command line
3. Run the SQL file:

```bash
mysql -u root -p < solar-mysql-db.sql
```

Or in phpMyAdmin: Import >> choose `solar-mysql-db.sql`

---

### Step 2 — Backend Setup

```bash
cd solar-backend

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env — set your MySQL password
# DB_PASSWORD=your_mysql_password

# 4. Start backend server
npm run dev
# Server runs at: http://localhost:5000
```

**Test the API:**
```
GET http://localhost:5000/api/health
GET http://localhost:5000/api/customers
GET http://localhost:5000/api/products
```

---

### Step 3 — Frontend Setup

```bash
cd solar-frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# App runs at: http://localhost:3000
```

---

### Step 4 — Email Notifications (Optional)

1. Go to your Google Account >> Security >> App Passwords
2. Generate an app password for "Mail"
3. Add to `solar-backend/.env`:
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_password
```

---

## Pages & Features

| Page / Feature        | URL              | Description                           |
|-----------------------|------------------|---------------------------------------|
| Home                  | `/`              | Hero, stats, services, products       |
| Solar Calculator      | `/#calculator`   | Enter bill >> see savings + chart      |
| PDF Invoice           | Modal on calc    | Download branded jsPDF invoice        |
| Google Maps           | `/#map-section`  | 5 installation locations              |
| Contact / Enquiry     | `/#contact`      | Form >> DB + email notification        |
| Admin Dashboard       | `/admin`         | 8-tab panel: all DB tables            |

---

## Database Tables

| Table           | Purpose                              |
|-----------------|--------------------------------------|
| customers       | Customer profiles                    |
| suppliers       | Panel/inverter suppliers             |
| products        | Solar panels, inverters, batteries   |
| orders          | Customer orders                      |
| order_items     | Line items per order                 |
| installations   | Installation scheduling & tracking   |
| payments        | Payment records                      |
| enquiries       | Contact form submissions             |
| subsidies       | Govt. subsidy applications           |
| employees       | Staff & technicians                  |

---

## API Endpoints

### Customers
```
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Products
```
GET    /api/products?category=panel
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
PATCH  /api/products/:id/stock
```

### Orders
```
GET    /api/orders/summary
POST   /api/orders
PATCH  /api/orders/:id/status
GET    /api/orders/stats/revenue
```

### Enquiries
```
GET    /api/enquiries
POST   /api/enquiries        << triggers email notification
PATCH  /api/enquiries/:id/respond
```

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, React Router v6     |
| Styling   | CSS Modules, Google Fonts (Syne)    |
| Charts    | Chart.js + react-chartjs-2          |
| PDF       | jsPDF + jspdf-autotable             |
| Backend   | Node.js, Express.js                 |
| Database  | MySQL 8.0 with mysql2 driver        |
| Email     | Nodemailer (Gmail SMTP)             |
| HTTP      | Axios with proxy via Vite           |




