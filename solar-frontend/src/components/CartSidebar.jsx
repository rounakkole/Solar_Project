import { useState } from 'react';
import { useCart, useToast } from '../App';
import styles from './CartSidebar.module.css';
import api from '../api/axios';

export default function CartSidebar() {
  const { cart, removeFromCart, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '' });

  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast('Cart is empty', '⚠️');
    
    setLoading(true);
    try {
      // Format the cart items into a message for the enquiry
      const message = `Requested Quote for:\n${cart.map(item => `- ${item.product_name} (₹${Number(item.price)})`).join('\n')}\n\nTotal Estimated: ₹${total}`;

      // Submit as an enquiry since guest users don't have a customer ID yet
      await api.post('/enquiries', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        service_type: 'Quote Request',
        monthly_bill: total,
        message: message
      });
      
      toast('Quotation requested successfully!', '✅');
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error(err);
      toast('Failed to submit quote', '❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isCartOpen && <div className={styles.overlay} onClick={() => setIsCartOpen(false)}></div>}
      <div className={`${styles.sidebar} ${isCartOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>🛒 Your Cart ({cart.length})</h2>
          <button className={styles.closeBtn} onClick={() => setIsCartOpen(false)}>✕</button>
        </div>
        
        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <p className={styles.empty}>Your cart is empty.</p>
          ) : (
            cart.map((item, index) => (
              <div key={index} className={styles.item}>
                <div className={styles.itemInfo}>
                  <h4>{item.product_name}</h4>
                  <p>₹{Number(item.price).toLocaleString('en-IN')}</p>
                </div>
                <button 
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(index)}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Total Estimated:</span>
              <span>₹{Number(total).toLocaleString('en-IN')}</span>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                value={formData.name}
                onChange={e => setFormData(p => ({...p, name: e.target.value}))}
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                value={formData.email}
                onChange={e => setFormData(p => ({...p, email: e.target.value}))}
              />
              <input 
                type="tel" 
                placeholder="Phone Number" 
                required 
                value={formData.phone}
                onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
              />
              <input 
                type="text" 
                placeholder="City" 
                required 
                value={formData.city}
                onChange={e => setFormData(p => ({...p, city: e.target.value}))}
              />
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Submitting...' : 'Request Formal Quote'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
