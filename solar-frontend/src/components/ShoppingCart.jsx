import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'
import styles from './ShoppingCart.module.css'

export default function ShoppingCart({ customerId }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const socket = useContext(SocketContext)

  // Fetch cart
  useEffect(() => {
    fetchCart()
  }, [customerId])

  // Listen to cart updates
  useEffect(() => {
    if (socket && customerId) {
      socket.emit('join_cart', customerId)
      socket.on('cart_updated', handleCartUpdate)
    }
    return () => socket?.off('cart_updated')
  }, [socket, customerId])

  const fetchCart = async () => {
    try {
      const response = await axios.get(
        `/api/cart/${customerId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setCart(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      setLoading(false)
    }
  }

  const handleCartUpdate = (data) => {
    if (data.action === 'item_added' || data.action === 'quantity_updated') {
      fetchCart()
    }
  }

  const addToCart = async (productId, quantity) => {
    try {
      await axios.post('/api/cart/add', {
        customer_id: customerId,
        product_id: productId,
        quantity
      }, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      fetchCart()
    } catch (error) {
      alert(error.response.data.message)
    }
  }

  const removeFromCart = async (cartItemId) => {
    try {
      await axios.delete(`/api/cart/item/${cartItemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      fetchCart()
    } catch (error) {
      alert('Failed to remove item')
    }
  }

  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      await axios.patch(`/api/cart/item/${cartItemId}`, 
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      )
      fetchCart()
    } catch (error) {
      alert('Failed to update quantity')
    }
  }

  if (loading) return <div>Loading cart...</div>
  if (!cart) return <div>Cart not available</div>

  return (
    <div className={styles.cartContainer}>
      <h2>Shopping Cart ({cart.total_items} items)</h2>
      
      {cart.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <table className={styles.cartTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map(item => (
                <tr key={item.cart_item_id}>
                  <td>{item.product_name}</td>
                  <td>₹{item.price}</td>
                  <td>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.cart_item_id, parseInt(e.target.value))}
                    />
                  </td>
                  <td>₹{(item.quantity * item.price).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeFromCart(item.cart_item_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.cartSummary}>
            <div>Subtotal: ₹{cart.subtotal.toFixed(2)}</div>
            <div>Tax (18%): ₹{cart.tax_amount.toFixed(2)}</div>
            <div className={styles.total}>Total: ₹{cart.total_amount.toFixed(2)}</div>
            <button className={styles.checkoutBtn}>Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  )
}
