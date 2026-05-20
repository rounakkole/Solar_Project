const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')
const Razorpay = require('razorpay')
const crypto = require('crypto')

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// ================================
// INIT PAYMENT
// ================================
router.post('/init', auth, async (req, res) => {
  try {
    console.log("========== PAYMENT INIT ==========")
    console.log("REQ BODY:", req.body)
    console.log("KEY ID:", process.env.RAZORPAY_KEY_ID)
    console.log("==================================")

    const { order_id, amount, customer_id, description } = req.body

    if (!order_id || !amount || !customer_id) {
      return res.status(400).json({
        success: false,
        message: 'order_id, amount, and customer_id are required'
      })
    }

    // Verify order exists
    const [order] = await db.query(
      'SELECT * FROM orders WHERE order_id = ? AND customer_id = ?',
      [order_id, customer_id]
    )

    if (!order.length) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `order_${order_id}`,
      notes: {
        order_id,
        customer_id
      }
    })

    console.log("RAZORPAY ORDER:", razorpayOrder)

    // Save Razorpay order
    await db.query(
      `INSERT INTO razorpay_orders 
      (order_id, razorpay_order_id, amount, status)
      VALUES (?, ?, ?, ?)`,
      [
        order_id,
        razorpayOrder.id,
        amount,
        'created'
      ]
    )

    res.json({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: amount,
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID
      }
    })

  } catch (err) {
    console.log("========== RAZORPAY ERROR ==========")
    console.log(err)
    console.log("====================================")

    res.status(500).json({
      success: false,
      message: err.message || 'Payment initialization failed'
    })
  }
})

// ================================
// VERIFY PAYMENT
// ================================
router.post('/verify', auth, async (req, res) => {
  try {
    console.log("VERIFY BODY:", req.body)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      customer_id,
      amount
    } = req.body

    // Validate fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details'
      })
    }

    // Generate expected signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest('hex')

    console.log("GENERATED:", generated_signature)
    console.log("RECEIVED :", razorpay_signature)

    // Verify signature
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      })
    }

    // Save payment
    const [paymentResult] = await db.query(
      `INSERT INTO payments
      (order_id, customer_id, amount, method, transaction_id, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        customer_id,
        amount,
        'razorpay',
        razorpay_payment_id,
        'completed'
      ]
    )

    // Update order status
    await db.query(
      `UPDATE orders
       SET status = ?
       WHERE order_id = ?`,
      ['confirmed', order_id]
    )

    // Update Razorpay order
    await db.query(
      `UPDATE razorpay_orders
       SET status = ?, payment_id = ?
       WHERE razorpay_order_id = ?`,
      [
        'verified',
        razorpay_payment_id,
        razorpay_order_id
      ]
    )

    if (req.io) {
      req.io?.emit('dashboard_update')
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment_id: paymentResult.insertId,
        order_id,
        amount
      }
    })

  } catch (err) {
    console.log("VERIFY PAYMENT ERROR:", err)

    res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed'
    })
  }
})

// ================================
// GET PAYMENT DETAILS
// ================================
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const [payment] = await db.query(
      `SELECT 
        p.*, 
        c.name AS customer_name,
        o.order_date
      FROM payments p
      JOIN customers c 
      ON p.customer_id = c.customer_id
      JOIN orders o 
      ON p.order_id = o.order_id
      WHERE p.payment_id = ?`,
      [req.params.paymentId]
    )

    if (!payment.length) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      })
    }

    res.json({
      success: true,
      data: payment[0]
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

module.exports = router