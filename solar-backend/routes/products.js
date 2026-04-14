const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth = require('../middleware/auth');
// GET all products (with supplier name)
router.get('/',auth, async (req, res) => {
  try {
    const { category } = req.query
    let sql = `
      SELECT p.*, s.company_name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.is_active = 1`
    const params = []
    if (category && category !== 'all') {
      sql += ' AND p.category = ?'; params.push(category)
    }
    sql += ' ORDER BY p.category, p.product_name'
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, s.company_name FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
       WHERE p.product_id = ?`, [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Product not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create product
router.post('/', async (req, res) => {
  const { supplier_id, product_name, model_number, category, brand, wattage, efficiency,
          warranty_years, price, mrp, stock_quantity, description } = req.body
  if (!product_name || !category || !price) {
    return res.status(400).json({ message: 'product_name, category and price are required' })
  }
  try {
    const [result] = await db.query(
      `INSERT INTO products (supplier_id, product_name, model_number, category, brand, wattage,
        efficiency, warranty_years, price, mrp, stock_quantity, description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [supplier_id, product_name, model_number, category, brand, wattage||0, efficiency||0,
       warranty_years||10, price, mrp||price, stock_quantity||0, description]
    )
    res.status(201).json({ insertId: result.insertId, message: 'Product created' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT update stock
router.patch('/:id/stock', async (req, res) => {
  const { qty } = req.body
  try {
    await db.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?', [qty, req.params.id])
    res.json({ message: 'Stock updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT full update
router.put('/:id', async (req, res) => {
  const { product_name, price, mrp, stock_quantity, description, is_active } = req.body
  try {
    await db.query(
      `UPDATE products SET product_name=?, price=?, mrp=?, stock_quantity=?, description=?, is_active=?
       WHERE product_id=?`,
      [product_name, price, mrp, stock_quantity, description, is_active, req.params.id]
    )
    res.json({ message: 'Product updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
