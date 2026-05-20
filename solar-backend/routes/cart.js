const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth    = require('../middleware/auth')

// GET user's cart
router.get('/:customerId', auth, async (req, res) => {
  try {
    const customerId = req.params.customerId
    
    // Get cart
    const [cart] = await db.query(
      'SELECT * FROM carts WHERE customer_id = ?',
      [customerId]
    )
    
    if (!cart.length) {
      // Create new cart if doesn't exist
      const [result] = await db.query(
        'INSERT INTO carts (customer_id) VALUES (?)',
        [customerId]
      )
      
      return res.json({
        success: true,
        data: {
          cart_id: result.insertId,
          customer_id: customerId,
          items: [],
          subtotal: 0,
          total_items: 0
        }
      })
    }
    
    const cartId = cart[0].cart_id
    
    // Get cart items with product details
    const [items] = await db.query(
      `SELECT ci.*, p.product_name, p.price, p.stock_quantity,
              (ci.quantity * p.price) as item_total
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    )
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const taxAmount = Math.round(subtotal * 0.18) // 18% GST
    const totalAmount = subtotal + taxAmount
    
    res.json({
      success: true,
      data: {
        cart_id: cartId,
        customer_id: customerId,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        total_items: items.length
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST add item to cart
router.post('/add', auth, async (req, res) => {
  const { customer_id, product_id, quantity } = req.body
  
  if (!customer_id || !product_id || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'customer_id, product_id, and quantity are required' 
    })
  }
  
  const conn = await db.pool.getConnection()
  try {
    await conn.beginTransaction()
    
    // Get or create cart
    const [existingCart] = await conn.query(
      'SELECT cart_id FROM carts WHERE customer_id = ?',
      [customer_id]
    )
    
    let cartId
    if (!existingCart.length) {
      const [cartResult] = await conn.query(
        'INSERT INTO carts (customer_id) VALUES (?)',
        [customer_id]
      )
      cartId = cartResult.insertId
    } else {
      cartId = existingCart[0].cart_id
    }
    
    // Check product exists and has stock
    const [product] = await conn.query(
      'SELECT stock_quantity, product_name, price FROM products WHERE product_id = ?',
      [product_id]
    )
    
    if (!product.length) {
      await conn.rollback()
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    
    if (product[0].stock_quantity < quantity) {
      await conn.rollback()
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Available: ${product[0].stock_quantity}, Requested: ${quantity}` 
      })
    }
    
    // Check if item already in cart
    const [existingItem] = await conn.query(
      'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, product_id]
    )
    
    if (existingItem.length) {
      // Update quantity
      const newQty = existingItem[0].quantity + quantity
      if (product[0].stock_quantity < newQty) {
        await conn.rollback()
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Available: ${product[0].stock_quantity}, Requested: ${newQty}` 
        })
      }
      
      await conn.query(
        'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
        [newQty, existingItem[0].cart_item_id]
      )
    } else {
      // Add new item
      await conn.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, product_id, quantity]
      )
    }
    
    await conn.commit()
    
    // Broadcast cart update
    req.io.to(`cart_${customer_id}`).emit('cart_updated', {
      customer_id,
      product_id,
      action: 'item_added',
      quantity
    })
    
    res.status(201).json({ 
      success: true, 
      message: 'Item added to cart',
      data: {
        product_id,
        product_name: product[0].product_name,
        quantity,
        price: product[0].price
      }
    })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ success: false, message: err.message })
  } finally {
    conn.release()
  }
})

// PATCH update cart item quantity
router.patch('/item/:cartItemId', auth, async (req, res) => {
  const { quantity } = req.body
  
  if (quantity === undefined || quantity < 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Quantity must be at least 1' 
    })
  }
  
  try {
    // Get cart item details
    const [cartItem] = await db.query(
      'SELECT ci.*, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_item_id = ?',
      [req.params.cartItemId]
    )
    
    if (!cartItem.length) {
      return res.status(404).json({ success: false, message: 'Cart item not found' })
    }
    
    if (cartItem[0].stock_quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Available: ${cartItem[0].stock_quantity}` 
      })
    }
    
    // Update quantity
    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
      [quantity, req.params.cartItemId]
    )
    
    // Get cart for broadcast
    const [cart] = await db.query(
      'SELECT customer_id FROM carts WHERE cart_id = ?',
      [cartItem[0].cart_id]
    )
    
    req.io.to(`cart_${cart[0].customer_id}`).emit('cart_updated', {
      customer_id: cart[0].customer_id,
      action: 'quantity_updated',
      cart_item_id: req.params.cartItemId,
      new_quantity: quantity
    })
    
    res.json({ 
      success: true, 
      message: 'Cart item updated',
      data: {
        cart_item_id: req.params.cartItemId,
        quantity
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE remove item from cart
router.delete('/item/:cartItemId', auth, async (req, res) => {
  try {
    // Get cart info before deletion
    const [cartItem] = await db.query(
      'SELECT ci.*, c.customer_id FROM cart_items ci JOIN carts c ON ci.cart_id = c.cart_id WHERE ci.cart_item_id = ?',
      [req.params.cartItemId]
    )
    
    if (!cartItem.length) {
      return res.status(404).json({ success: false, message: 'Cart item not found' })
    }
    
    // Delete item
    await db.query(
      'DELETE FROM cart_items WHERE cart_item_id = ?',
      [req.params.cartItemId]
    )
    
    // Broadcast cart update
    req.io.to(`cart_${cartItem[0].customer_id}`).emit('cart_updated', {
      customer_id: cartItem[0].customer_id,
      action: 'item_removed',
      cart_item_id: req.params.cartItemId
    })
    
    res.json({ 
      success: true, 
      message: 'Item removed from cart'
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE clear entire cart
router.delete('/clear/:customerId', auth, async (req, res) => {
  try {
    const [cart] = await db.query(
      'SELECT cart_id FROM carts WHERE customer_id = ?',
      [req.params.customerId]
    )
    
    if (!cart.length) {
      return res.status(404).json({ success: false, message: 'Cart not found' })
    }
    
    // Clear all items
    await db.query(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cart[0].cart_id]
    )
    
    // Broadcast cart cleared
    req.io.to(`cart_${req.params.customerId}`).emit('cart_updated', {
      customer_id: req.params.customerId,
      action: 'cart_cleared'
    })
    
    res.json({ 
      success: true, 
      message: 'Cart cleared'
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router