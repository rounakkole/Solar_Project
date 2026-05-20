const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth    = require('../middleware/auth')
const jsPDF   = require('jspdf')
const autoTable = require('jspdf-autotable')

// GET all quotations for customer
router.get('/', auth, async (req, res) => {
  try {
    const { customer_id, status } = req.query
    
    let sql = `
      SELECT q.*, c.name as customer_name, c.email, c.phone, c.city
      FROM quotations q
      JOIN customers c ON q.customer_id = c.customer_id
      WHERE 1=1`
    const params = []
    
    if (customer_id) {
      sql += ' AND q.customer_id = ?'
      params.push(customer_id)
    }
    if (status) {
      sql += ' AND q.status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY q.created_at DESC'
    const [quotations] = await db.query(sql, params)
    
    res.json({
      success: true,
      count: quotations.length,
      data: quotations
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET single quotation with items
router.get('/:id', auth, async (req, res) => {
  try {
    const [quotation] = await db.query(
      `SELECT q.*, c.name as customer_name, c.email, c.phone, c.address, c.city
       FROM quotations q
       JOIN customers c ON q.customer_id = c.customer_id
       WHERE q.quotation_id = ?`,
      [req.params.id]
    )
    
    if (!quotation.length) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }
    
    const [items] = await db.query(
      `SELECT qi.*, p.product_name, p.category, p.brand, p.specifications
       FROM quotation_items qi
       JOIN products p ON qi.product_id = p.product_id
       WHERE qi.quotation_id = ?`,
      [req.params.id]
    )
    
    res.json({
      success: true,
      data: {
        ...quotation[0],
        items
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST create quotation from cart
router.post('/', auth, async (req, res) => {
  const { customer_id, items, validity_days = 30, notes = '' } = req.body
  
  if (!customer_id || !items || items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'customer_id and items are required' 
    })
  }
  
  const conn = await db.pool.getConnection()
  try {
    await conn.beginTransaction()
    
    // Calculate totals
    let subtotal = 0
    for (const item of items) {
      subtotal += item.quantity * item.unit_price
    }
    
    const taxAmount = Math.round(subtotal * 0.18) // 18% GST
    const totalAmount = subtotal + taxAmount
    
    // Generate quotation number
    const quotationNo = `QT-${Date.now().toString().slice(-8)}`
    
    // Create quotation
    const [result] = await conn.query(
      `INSERT INTO quotations (customer_id, quotation_number, subtotal, tax_amount, total_amount, validity_days, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [customer_id, quotationNo, subtotal, taxAmount, totalAmount, validity_days, notes]
    )
    
    const quotationId = result.insertId
    
    // Add items
    for (const item of items) {
      await conn.query(
        `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [quotationId, item.product_id, item.quantity, item.unit_price]
      )
    }
    
    await conn.commit()
    
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: {
        quotation_id: quotationId,
        quotation_number: quotationNo,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
      }
    })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ success: false, message: err.message })
  } finally {
    conn.release()
  }
})

// PATCH update quotation status
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body
  const validStatuses = ['draft', 'sent', 'accepted', 'converted', 'rejected']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: `Status must be one of: ${validStatuses.join(', ')}` 
    })
  }
  
  try {
    await db.query(
      'UPDATE quotations SET status = ? WHERE quotation_id = ?',
      [status, req.params.id]
    )
    
    res.json({
      success: true,
      message: `Quotation status updated to ${status}`
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST convert quotation to order
router.post('/:id/convert', auth, async (req, res) => {
  const { customer_id } = req.body
  
  if (!customer_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'customer_id is required' 
    })
  }
  
  const conn = await db.pool.getConnection()
  try {
    await conn.beginTransaction()
    
    // Get quotation
    const [quotation] = await conn.query(
      'SELECT * FROM quotations WHERE quotation_id = ?',
      [req.params.id]
    )
    
    if (!quotation.length) {
      await conn.rollback()
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }
    
    // Get quotation items
    const [items] = await conn.query(
      'SELECT * FROM quotation_items WHERE quotation_id = ?',
      [req.params.id]
    )
    
    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_id, subtotal, gst_amount, total_amount, notes, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [customer_id, quotation[0].subtotal, quotation[0].tax_amount, quotation[0].total_amount, `From quotation: ${quotation[0].quotation_number}`]
    )
    
    const orderId = orderResult.insertId
    
    // Add order items and update stock
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      )
      
      // Decrease stock
      await conn.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      )
    }
    
    // Update quotation status
    await conn.query(
      'UPDATE quotations SET status = ? WHERE quotation_id = ?',
      ['converted', req.params.id]
    )
    
    await conn.commit()
    
    res.json({
      success: true,
      message: 'Quotation converted to order',
      data: {
        order_id: orderId,
        total_amount: quotation[0].total_amount
      }
    })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ success: false, message: err.message })
  } finally {
    conn.release()
  }
})

// GET quotation as PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const [quotation] = await db.query(
      `SELECT q.*, c.name as customer_name, c.email, c.phone, c.address, c.city
       FROM quotations q
       JOIN customers c ON q.customer_id = c.customer_id
       WHERE q.quotation_id = ?`,
      [req.params.id]
    )
    
    if (!quotation.length) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }
    
    const [items] = await db.query(
      `SELECT qi.*, p.product_name, p.category, p.brand
       FROM quotation_items qi
       JOIN products p ON qi.product_id = p.product_id
       WHERE qi.quotation_id = ?`,
      [req.params.id]
    )
    
    // Generate PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Header
    doc.setFontSize(20)
    doc.text('SOLAR QUOTATION', pageWidth / 2, 15, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`Quotation No: ${quotation[0].quotation_number}`, 15, 30)
    doc.text(`Date: ${new Date(quotation[0].created_at).toLocaleDateString()}`, 15, 37)
    doc.text(`Valid Till: ${new Date(new Date(quotation[0].created_at).getTime() + quotation[0].validity_days * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 15, 44)
    
    // Customer details
    doc.setFontSize(11)
    doc.text('Bill To:', 15, 55)
    doc.setFontSize(10)
    doc.text(quotation[0].customer_name, 15, 62)
    doc.text(quotation[0].address || '', 15, 69)
    doc.text(`${quotation[0].city} | Ph: ${quotation[0].phone}`, 15, 76)
    doc.text(quotation[0].email, 15, 83)
    
    // Items table
    const tableData = items.map(item => [
      item.product_name,
      item.quantity,
      `₹${item.unit_price.toFixed(2)}`,
      `₹${(item.quantity * item.unit_price).toFixed(2)}`
    ])
    
    doc.autoTable({
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      startY: 95,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    })
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Subtotal: ₹${quotation[0].subtotal.toFixed(2)}`, pageWidth - 50, finalY)
    doc.text(`GST (18%): ₹${quotation[0].tax_amount.toFixed(2)}`, pageWidth - 50, finalY + 7)
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text(`Total: ₹${quotation[0].total_amount.toFixed(2)}`, pageWidth - 50, finalY + 15)
    
    // Footer
    doc.setFontSize(8)
    doc.text('This is a computer-generated quotation. No signature required.', pageWidth / 2, pageHeight - 10, { align: 'center' })
    
    // Send PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    res.contentType('application/pdf')
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router