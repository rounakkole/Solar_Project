const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth = require('../middleware/auth');
// GET all suppliers
router.get('/',auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers ORDER BY company_name')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single supplier with their products
router.get('/:id', async (req, res) => {
  try {
    const [sup] = await db.query('SELECT * FROM suppliers WHERE supplier_id = ?', [req.params.id])
    if (!sup.length) return res.status(404).json({ message: 'Supplier not found' })
    const [products] = await db.query(
      'SELECT * FROM products WHERE supplier_id = ? AND is_active = 1', [req.params.id]
    )
    res.json({ ...sup[0], products })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create supplier
router.post('/', async (req, res) => {
  const { company_name, contact_person, email, phone, address, city, gst_number, pan_number } = req.body
  if (!company_name || !phone) {
    return res.status(400).json({ message: 'company_name and phone are required' })
  }
  try {
    const [result] = await db.query(
      `INSERT INTO suppliers (company_name, contact_person, email, phone, address, city, gst_number, pan_number)
       VALUES (?,?,?,?,?,?,?,?)`,
      [company_name, contact_person, email, phone, address, city, gst_number, pan_number]
    )
    res.status(201).json({ insertId: result.insertId, message: 'Supplier created' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'GST number already exists' })
    res.status(500).json({ message: err.message })
  }
})

// PUT update supplier
router.put('/:id', async (req, res) => {
  const { company_name, contact_person, email, phone, address, city, gst_number, status } = req.body
  try {
    await db.query(
      `UPDATE suppliers SET company_name=?, contact_person=?, email=?, phone=?,
       address=?, city=?, gst_number=?, status=? WHERE supplier_id=?`,
      [company_name, contact_person, email, phone, address, city, gst_number, status, req.params.id]
    )
    res.json({ message: 'Supplier updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE suppliers SET status = "inactive" WHERE supplier_id = ?', [req.params.id])
    res.json({ message: 'Supplier deactivated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
