const express = require('express')
const router  = require('express').Router()
const db      = require('../config/db')
const { sendEnquiryConfirmation } = require('../config/email')
const auth = require('../middleware/auth');

// GET all enquiries
router.get('/',auth, async (req, res) => {
  try {
    const { is_responded } = req.query
    let sql = 'SELECT * FROM enquiries WHERE 1=1'
    const params = []
    if (is_responded !== undefined) {
      sql += ' AND is_responded = ?'
      params.push(is_responded === 'true' ? 1 : 0)
    }
    sql += ' ORDER BY submitted_at DESC'
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single enquiry
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM enquiries WHERE enquiry_id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Enquiry not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST submit enquiry (public — from contact form)
router.post('/', async (req, res) => {
  const { name, email, phone, city, property_type, service_type, monthly_bill, message } = req.body

  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' })
  }

  try {
    const [result] = await db.query(
      `INSERT INTO enquiries (name, email, phone, city, property_type, service_type, monthly_bill, message, source)
       VALUES (?,?,?,?,?,?,?,?,'website')`,
      [name, email, phone, city, property_type||'residential', service_type, monthly_bill||null, message]
    )

    // Send confirmation email (async — don't await to avoid slow response)
    if (email) {
      sendEnquiryConfirmation({ name, email, phone, city, service_type, monthly_bill }).catch(() => {})
    }

    res.status(201).json({
      enquiry_id: result.insertId,
      message: 'Enquiry submitted! We will contact you within 24 hours.',
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH mark as responded
router.patch('/:id/respond', async (req, res) => {
  const { assigned_to } = req.body
  try {
    await db.query(
      'UPDATE enquiries SET is_responded = 1, assigned_to = ? WHERE enquiry_id = ?',
      [assigned_to || 'Admin', req.params.id]
    )
    res.json({ message: 'Marked as responded' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE enquiry
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM enquiries WHERE enquiry_id = ?', [req.params.id])
    res.json({ message: 'Enquiry deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET enquiry stats
router.get('/stats/summary', async (req, res) => {
  try {
    const [total]     = await db.query('SELECT COUNT(*) AS count FROM enquiries')
    const [pending]   = await db.query('SELECT COUNT(*) AS count FROM enquiries WHERE is_responded = 0')
    const [today]     = await db.query('SELECT COUNT(*) AS count FROM enquiries WHERE DATE(submitted_at) = CURDATE()')
    const [byService] = await db.query(
      'SELECT service_type, COUNT(*) AS count FROM enquiries GROUP BY service_type ORDER BY count DESC'
    )
    res.json({
      total:     total[0].count,
      pending:   pending[0].count,
      today:     today[0].count,
      byService,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
