const express  = require('express')
const router   = express.Router()
const db       = require('../config/db')
const auth = require('../middleware/auth');

// GET all customers
router.get('/',auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE customer_id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Customer not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create customer
router.post('/', async (req, res) => {
  const { name, email, phone, address, city, state, pincode, property_type } = req.body
  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Name, email and phone are required' })
  }
  try {
    const [result] = await db.query(
      `INSERT INTO customers (name, email, phone, address, city, state, pincode, property_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, address, city, state || 'Maharashtra', pincode, property_type || 'residential']
    )
    const [newRow] = await db.query('SELECT * FROM customers WHERE customer_id = ?', [result.insertId])
    res.status(201).json(newRow[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' })
    res.status(500).json({ message: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  const { name, email, phone, address, city, state, pincode, property_type } = req.body
  try {
    await db.query(
      `UPDATE customers SET name=?, email=?, phone=?, address=?, city=?, state=?, pincode=?, property_type=?
       WHERE customer_id=?`,
      [name, email, phone, address, city, state, pincode, property_type, req.params.id]
    )
    res.json({ message: 'Customer updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE customer_id = ?', [req.params.id])
    res.json({ message: 'Customer deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
