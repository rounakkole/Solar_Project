const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth = require('../middleware/auth');
// GET summary for admin dashboard
router.get('/summary',auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, c.name AS customer_name, c.phone
      FROM installations i
      JOIN customers c ON i.customer_id = c.customer_id
      ORDER BY i.created_at DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET all installations (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, city } = req.query
    let sql = `
      SELECT i.*, c.name AS customer_name, c.phone
      FROM installations i
      JOIN customers c ON i.customer_id = c.customer_id
      WHERE 1=1`
    const params = []
    if (status) { sql += ' AND i.status = ?'; params.push(status) }
    if (city)   { sql += ' AND i.city = ?';   params.push(city)   }
    sql += ' ORDER BY i.created_at DESC'
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single installation
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, c.name AS customer_name, c.email, c.phone, c.city AS customer_city
      FROM installations i
      JOIN customers c ON i.customer_id = c.customer_id
      WHERE i.installation_id = ?`, [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Installation not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create installation
router.post('/', async (req, res) => {
  const {
    order_id, customer_id, technician_name, technician_phone,
    install_address, city, latitude, longitude,
    panel_count, total_kw, roof_type, scheduled_date, notes
  } = req.body
  if (!order_id || !customer_id) {
    return res.status(400).json({ message: 'order_id and customer_id are required' })
  }
  try {
    const [result] = await db.query(
      `INSERT INTO installations
        (order_id, customer_id, technician_name, technician_phone, install_address,
         city, latitude, longitude, panel_count, total_kw, roof_type, scheduled_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [order_id, customer_id, technician_name, technician_phone, install_address,
       city, latitude, longitude, panel_count, total_kw, roof_type||'flat', scheduled_date, notes]
    )
    res.status(201).json({ installation_id: result.insertId, message: 'Installation scheduled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH update status
router.patch('/:id/status', async (req, res) => {
  const { status, completion_date } = req.body
  const valid = ['scheduled','in_progress','completed','on_hold']
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' })
  try {
    await db.query(
      `UPDATE installations SET status=?, completion_date=? WHERE installation_id=?`,
      [status, completion_date || null, req.params.id]
    )
    // If completed, also update order status
    if (status === 'completed') {
      const [inst] = await db.query('SELECT order_id FROM installations WHERE installation_id=?', [req.params.id])
      if (inst.length) {
        await db.query('UPDATE orders SET status="installed" WHERE order_id=?', [inst[0].order_id])
      }
    }
    res.json({ message: 'Installation status updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET map data (lat/lng for all completed installs)
router.get('/map/locations', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.installation_id, i.city, i.latitude, i.longitude, i.total_kw, i.status,
             c.name AS customer_name
      FROM installations i
      JOIN customers c ON i.customer_id = c.customer_id
      WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
