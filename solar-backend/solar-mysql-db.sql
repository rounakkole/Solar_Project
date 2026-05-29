-- ============================================================
-- SOLAR PANEL INSTALLATION WEBSITE - COMPLETE DATABASE
-- Project  : Final Semester Project
-- Database : MySQL 8.0+
-- Run      : mysql -u root -p < solar-mysql-db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `solar-mysql-db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `solar-mysql-db`;

-- ───────────────────────────────────────────────────────────
-- TABLE 1: CUSTOMERS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  customer_id   INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  UNIQUE NOT NULL,
  phone         VARCHAR(15)   NOT NULL,
  address       TEXT,
  city          VARCHAR(50),
  state         VARCHAR(50)   DEFAULT 'Maharashtra',
  pincode       VARCHAR(10),
  property_type ENUM('residential','commercial','industrial') DEFAULT 'residential',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- TABLE 2: SUPPLIERS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id    INT AUTO_INCREMENT PRIMARY KEY,
  company_name   VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  email          VARCHAR(100) UNIQUE,
  phone          VARCHAR(15),
  address        TEXT,
  city           VARCHAR(50),
  gst_number     VARCHAR(20)  UNIQUE,
  pan_number     VARCHAR(15),
  bank_name      VARCHAR(100),
  bank_account   VARCHAR(20),
  ifsc_code      VARCHAR(15),
  status         ENUM('active','inactive','blacklisted') DEFAULT 'active',
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- TABLE 3: PRODUCTS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  product_id     INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id    INT,
  product_name   VARCHAR(150)  NOT NULL,
  model_number   VARCHAR(100),
  category       ENUM('panel','inverter','battery','structure','accessory','cable') NOT NULL,
  brand          VARCHAR(100),
  wattage        INT           DEFAULT 0,
  efficiency     DECIMAL(5,2)  DEFAULT 0,
  warranty_years INT           DEFAULT 10,
  price          DECIMAL(10,2) NOT NULL,
  mrp            DECIMAL(10,2),
  stock_quantity INT           DEFAULT 0,
  description    TEXT,
  specifications TEXT,
  image_url      VARCHAR(255),
  is_active      BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- ───────────────────────────────────────────────────────────
-- TABLE 4: ORDERS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  order_id       INT AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT           NOT NULL,
  order_date     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  system_size_kw DECIMAL(8,2)  DEFAULT 0,
  subtotal       DECIMAL(12,2),
  gst_amount     DECIMAL(12,2) DEFAULT 0,
  subsidy_amount DECIMAL(12,2) DEFAULT 0,
  discount       DECIMAL(12,2) DEFAULT 0,
  total_amount   DECIMAL(12,2) NOT NULL,
  notes          TEXT,
  status         ENUM('pending','confirmed','in_progress','installed','cancelled') DEFAULT 'pending',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ───────────────────────────────────────────────────────────
-- TABLE 5: ORDER ITEMS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  item_id     INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT           NOT NULL,
  product_id  INT           NOT NULL,
  quantity    INT           NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  FOREIGN KEY (order_id)   REFERENCES orders(order_id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ───────────────────────────────────────────────────────────
-- TABLE 6: INSTALLATIONS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS installations (
  installation_id  INT AUTO_INCREMENT PRIMARY KEY,
  order_id         INT          NOT NULL,
  customer_id      INT          NOT NULL,
  technician_name  VARCHAR(100),
  technician_phone VARCHAR(15),
  install_address  TEXT,
  city             VARCHAR(50),
  latitude         DECIMAL(10,8),
  longitude        DECIMAL(11,8),
  panel_count      INT,
  total_kw         DECIMAL(8,2),
  roof_type        ENUM('flat','sloped','ground') DEFAULT 'flat',
  scheduled_date   DATE,
  completion_date  DATE,
  status           ENUM('scheduled','in_progress','completed','on_hold') DEFAULT 'scheduled',
  notes            TEXT,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)    REFERENCES orders(order_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ───────────────────────────────────────────────────────────
-- TABLE 7: PAYMENTS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  payment_id     INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT           NOT NULL,
  customer_id    INT           NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  payment_date   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  due_date       DATE,
  method         ENUM('cash','upi','card','neft','rtgs','cheque','emi') DEFAULT 'upi',
  transaction_id VARCHAR(100),
  bank_ref       VARCHAR(100),
  invoice_no     VARCHAR(50),
  status         ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  notes          TEXT,
  FOREIGN KEY (order_id)    REFERENCES orders(order_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ───────────────────────────────────────────────────────────
-- TABLE 8: ENQUIRIES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id    INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100),
  phone         VARCHAR(15)  NOT NULL,
  city          VARCHAR(50),
  property_type ENUM('residential','commercial','industrial') DEFAULT 'residential',
  service_type  VARCHAR(100),
  monthly_bill  DECIMAL(10,2),
  message       TEXT,
  source        VARCHAR(50)  DEFAULT 'website',
  is_responded  BOOLEAN      DEFAULT FALSE,
  assigned_to   VARCHAR(100),
  submitted_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- TABLE 9: SUBSIDIES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subsidies (
  subsidy_id    INT AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT          NOT NULL,
  order_id      INT          NOT NULL,
  scheme_name   VARCHAR(200),
  applied_date  DATE,
  approved_date DATE,
  amount        DECIMAL(12,2),
  reference_no  VARCHAR(100),
  status        ENUM('not_applied','applied','approved','rejected','received') DEFAULT 'not_applied',
  documents     TEXT,
  notes         TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  FOREIGN KEY (order_id)    REFERENCES orders(order_id)
);

-- ───────────────────────────────────────────────────────────
-- TABLE 10: EMPLOYEES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  employee_id  INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  role         ENUM('technician','sales','admin','manager') DEFAULT 'technician',
  phone        VARCHAR(15),
  email        VARCHAR(100) UNIQUE,
  address      TEXT,
  joining_date DATE,
  salary       DECIMAL(10,2),
  is_active    BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Customers

INSERT INTO customers (name, email, phone, address, city, state, pincode, property_type)
SELECT * FROM (VALUES
    ROW('Rajesh D', 'rajesh@email.com', '9876543210', 'Flat 4B, Sadar', 'Chinchwad', 'Maharashtra', '440001', 'residential'),
    ROW('Priya H', 'priya@email.com', '9765432109', 'Baner Road', 'Pune', 'Maharashtra', '411045', 'commercial')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM customers);



INSERT INTO customers (name, email, phone, address, city, state, pincode, property_type) 
SELECT * FROM (VALUES
    ROW('Rajesh D',  'rajesh@email.com',  '9876543210', 'Flat 4B, Sadar',        'Chinchwad',  'Maharashtra', '440001', 'residential'),
    ROW('Priya H',  'priya@email.com',   '9765432109', 'Baner Road',            'Pune',    'Maharashtra', '411045', 'commercial'),
    ROW('Amit A',    'amit@email.com',    '9654321098', 'Andheri East',          'Mumbai',  'Maharashtra', '400069', 'industrial'),
    ROW('Sunita Z',  'sunita@email.com',  '9543210987', 'Gangapur Road',         'Nashik',  'Maharashtra', '422013', 'residential'),
    ROW('Deepak C',  'deepak@email.com',  '9432109876', 'Dharampeth',            'Pimpri',  'Maharashtra', '440010', 'residential'),
    ROW('Kavita R',  'kavita@email.com',  '9321098765', 'Camp Area',             'Pune',    'Maharashtra', '411001', 'commercial'),
    ROW('Arun L',    'arun@email.com',    '9210987654', 'Borivali West',         'Mumbai',  'Maharashtra', '400092', 'residential'),
    ROW('Suresh S',   'suresh@email.com',  '9109876543', 'Satpur MIDC',           'Nashik',  'Maharashtra', '422007', 'industrial')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM customers);

-- Suppliers
INSERT INTO suppliers (company_name, contact_person, email, phone, city, gst_number, status) 
SELECT * FROM (VALUES
    ROW('Waaree Energies Ltd',   'Mr. Patil',  'patil@waaree.com',    '9800000001', 'Surat',   '27AABCW5678G1Z1', 'active'),
    ROW('Luminous Power Tech',   'Mr. Gupta',  'gupta@luminous.com',  '9800000002', 'Delhi',   '07AABCL9012H2Z2', 'active'),
    ROW('Tata Power Solar',      'Ms. Singh',  'singh@tatapwr.com',   '9800000003', 'Mumbai',  '27AABCT3456I3Z3', 'active'),
    ROW('Nexus Metal Struct',    'Mr. Desai',  'desai@nexus.com',     '9800000004', 'Pune',    '27AABCN7890J4Z4', 'active'),
    ROW('Exide Industries',      'Mr. Roy',    'roy@exide.com',       '9800000005', 'Kolkata', '19AABCE1234K5Z5', 'active')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM suppliers);

-- Products
INSERT INTO products (supplier_id, product_name, model_number, category, brand, wattage, efficiency, warranty_years, price, mrp, stock_quantity, description) 
SELECT * FROM (VALUES
    ROW(1,'Mono PERC Solar Panel 400W','WE-400M-72','panel',   'Waaree',  400, 21.3, 25, 18500.00, 21000.00, 150, 'High-efficiency monocrystalline PERC panel. Anti-reflective coating.'),
    ROW(1,'Poly Solar Panel 330W',     'WE-330P-60','panel',   'Waaree',  330, 17.8, 25, 14200.00, 16500.00, 200, 'Budget polycrystalline panel. Ideal for large installations.'),
    ROW(3,'Bi-facial Panel 450W',      'TP-450BF',  'panel',   'Tata',    450, 22.1, 25, 24000.00, 27000.00,  80, 'Premium bi-facial panel. Generates from both sides.'),
    ROW(2,'Hybrid Inverter 5kW',       'LMN-HY5000','inverter','Luminous',  0, 97.6, 10, 32000.00, 36000.00,  40, 'On/off-grid hybrid. WiFi monitoring.'),
    ROW(2,'String Inverter 3kW',       'LMN-ST3000','inverter','Luminous',  0, 97.2, 10, 18500.00, 22000.00,  60, 'Grid-tied, IP65 rated. 10-year warranty.'),
    ROW(2,'String Inverter 10kW',      'LMN-ST10K', 'inverter','Luminous',  0, 97.8, 10, 55000.00, 62000.00,  25, 'Commercial-grade 10kW MPPT dual tracker.'),
    ROW(5,'Lithium Battery 5kWh',      'EX-LFP5000','battery', 'Exide',     0, 96.0, 10, 85000.00, 95000.00,  20, 'LiFePO4, 6000-cycle life, built-in BMS.'),
    ROW(5,'Lead Acid Battery 150Ah',   'EX-LA150',  'battery', 'Exide',     0, 85.0,  5, 12000.00, 14500.00, 100, 'VRLA maintenance-free. C10 rated.'),
    ROW(4,'GI Mount Structure 5kW',    'NX-STR5K',  'structure','Nexus',    0,  0.0, 15, 12000.00, 14000.00,  50, 'Hot-dip galvanized, 150 kmph wind-rated.'),
    ROW(4,'ACDB/DCDB Box',             'NX-ACDC',   'accessory','Nexus',    0,  0.0,  5,  4500.00,  5500.00,  80, 'AC/DC distribution box with MCB protection.'),
    ROW(4,'4 Sqmm DC Cable (100m)',    'PC-SOL04',  'cable',   'Polycab',  0,  1.5,  5,  4200.00,  5500.00,  120, 'TUV-certified, single-core copper DC cable. XLPO insulation.')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM products);

-- Orders
INSERT INTO orders (customer_id, system_size_kw, subtotal, gst_amount, subsidy_amount, total_amount, status) 
SELECT * FROM (VALUES
    ROW(1,  5.0,  280000,  50400,  78000,  247000, 'installed'),
    ROW(2, 10.0,  520000,  93600,  78000,  485000, 'confirmed'),
    ROW(3, 50.0, 2200000, 396000,      0, 2250000, 'pending'),
    ROW(4,  3.0,  175000,  31500,  52500,  158000, 'installed'),
    ROW(5,  0.0,   16000,   2880,      0,   18000, 'confirmed'),
    ROW(6, 15.0,  740000, 133200,  78000,  745000, 'in_progress'),
    ROW(7,  4.0,  215000,  38700,  64500,  175000, 'pending')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM orders);

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
SELECT * FROM (VALUES
    ROW(1, 1, 13, 18500), (1, 4, 1, 32000), (1, 9, 1, 12000),
    ROW(2, 1, 26, 18500), (2, 6, 1, 55000), (2, 9, 2, 12000),
    ROW(4, 1,  8, 18500), (4, 5, 1, 18500), (4, 9, 1, 12000)
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM order_items);

-- Installations
INSERT INTO installations (order_id, customer_id, technician_name, technician_phone, city, latitude, longitude, panel_count, total_kw, roof_type, scheduled_date, completion_date, status) 
SELECT * FROM (VALUES
    ROW(1, 1, 'Ravi Yadav',   '9700000001', 'Nagpur',  21.1458, 79.0882, 13, 5.0,  'flat',   '2025-03-15', '2025-03-18', 'completed'),
    ROW(4, 4, 'Suresh Pawar', '9700000002', 'Nashik',  19.9975, 73.7898,  8, 3.0,  'sloped', '2025-03-22', '2025-03-25', 'completed'),
    ROW(2, 2, 'Vikram Nair',  '9700000003', 'Pune',    18.5204, 73.8567, 26, 10.0, 'flat',   '2025-03-28',  NULL,        'in_progress'),
    ROW(3, 3, 'Team Alpha',   '9700000004', 'Mumbai',  19.0760, 72.8777,125, 50.0, 'ground', '2025-04-05',  NULL,        'scheduled')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM installations);

-- Payments
INSERT INTO payments (order_id, customer_id, amount, payment_date, method, transaction_id, invoice_no, status) 
SELECT * FROM (VALUES
    ROW(1, 1, 247000, '2025-03-16 10:30:00', 'neft',   'NEFT20250316001', 'INV-2025-001', 'completed'),
    ROW(2, 2, 200000, '2025-03-19 14:15:00', 'rtgs',   'RTGS20250319001', 'INV-2025-002', 'completed'),
    ROW(3, 3, 500000, '2025-03-21 09:00:00', 'cheque', 'CHQ00123456',     'INV-2025-003', 'pending'),
    ROW(4, 4, 158000, '2025-03-22 16:45:00', 'upi',    'UPI20250322001',  'INV-2025-004', 'completed'),
    ROW(5, 5,  18000, '2025-03-25 11:20:00', 'upi',    'UPI20250325001',  'INV-2025-005', 'completed')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM payments);

-- Enquiries
INSERT INTO enquiries (name, email, phone, city, property_type, service_type, monthly_bill, message) 
SELECT * FROM (VALUES
    ROW('Rohit Y', 'rohit@email.com', '9100000001', 'Pimpri', 'residential', 'Residential Solar Installation', 3500,  'Interested in 5kW system for my home.'),
    ROW('Neha W', 'neha@email.com',  '9100000002', 'Pune',   'commercial',  'Commercial Solar Installation',  12000, 'Need solar for my showroom.'),
    ROW('Raju T',   'raju@email.com',  '9100000003', 'Nashik', 'residential', 'Subsidy Assistance',              2800, 'Want to apply for PM Surya Ghar subsidy.')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM Enquiries);

-- Subsidies
INSERT INTO subsidies (customer_id, order_id, scheme_name, applied_date, amount, status) 
SELECT * FROM (VALUES
    ROW(1, 1, 'PM Surya Rooftop Solar Yojana', '2025-03-10', 78000, 'received'),
    ROW(4, 4, 'PM Surya Rooftop Solar Yojana', '2025-03-15', 52500, 'approved'),
    ROW(7, 7, 'PM Surya Rooftop Solar Yojana', '2025-03-20', 64500, 'applied')
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM Subsidies);

-- Employees
INSERT INTO employees (name, role, phone, email, joining_date, salary) 
SELECT * FROM (VALUES
    ROW('Sandeep B',    'manager',    '9200000001', 'sandeep@gmail.in', '2020-01-15', 65000),
    ROW('Ravi T',      'technician', '9700000001', 'ravi@gmail.in',    '2021-06-01', 28000),
    ROW('Suresh R',    'technician', '9700000002', 'suresh@gmail.in',  '2022-03-01', 26000),
    ROW('Vikram S',     'technician', '9700000003', 'vikram@gmail.in',  '2021-09-15', 27000),
    ROW('Anjali M',  'sales',      '9200000005', 'anjali@gmail.in',  '2023-01-10', 32000),
    ROW('Prathamesh K', 'admin',      '9200000006', 'Prathamesh@gmail.in',   '2022-07-01', 30000)
) AS test_data
WHERE NOT EXISTS (SELECT 1 FROM employees);

-- ────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_order_summary AS
SELECT o.order_id, c.name AS customer_name, c.phone, c.city,
       o.system_size_kw, o.total_amount, o.status AS order_status,
       i.status AS install_status, p.status AS payment_status
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN installations i ON o.order_id = i.order_id
LEFT JOIN payments p ON o.order_id = p.order_id;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month,
       SUM(amount)  AS total_revenue,
       COUNT(*)     AS payment_count
FROM payments WHERE status = 'completed'
GROUP BY DATE_FORMAT(payment_date,'%Y-%m')
ORDER BY month DESC;

CREATE OR REPLACE VIEW v_product_inventory AS
SELECT p.product_id, p.product_name, p.category, p.brand,
       p.price, p.stock_quantity, s.company_name AS supplier
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
WHERE p.is_active = TRUE;

-- ============================================================
-- END OF SCRIPT
-- ============================================================
