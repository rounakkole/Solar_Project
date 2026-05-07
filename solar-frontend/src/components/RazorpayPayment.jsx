import React, { useEffect } from 'react'
import axios from 'axios'

export default function RazorpayPayment({ orderId, amount, customerId, onSuccess }) {
  const loadRazorpayScript = async () => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }

  useEffect(() => {
    loadRazorpayScript()
  }, [])

  const initiatePayment = async () => {
    try {
      // Step 1: Initialize Razorpay order
      const response = await axios.post('/api/payments/razorpay/init', {
        order_id: orderId,
        amount: amount,
        customer_id: customerId,
        description: `Order #${orderId}`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      const razorpayOrderId = response.data.data.razorpay_order_id
      const keyId = response.data.data.key_id

      // Step 2: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'SolarTech Solutions',
        description: `Payment for Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          // Step 3: Verify payment
          try {
            const verifyResponse = await axios.post('/api/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
              customer_id: customerId,
              amount: amount
            }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })

            if (verifyResponse.data.success) {
              alert('Payment successful! ✅')
              onSuccess(verifyResponse.data.data)
            }
          } catch (error) {
            alert('Payment verification failed: ' + error.response.data.message)
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9000090000'
        },
        theme: {
          color: '#3399cc'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      alert('Failed to initiate payment: ' + error.response.data.message)
    }
  }

  return (
    <button onClick={initiatePayment}>
      Pay ₹{amount.toFixed(2)} with Razorpay
    </button>
  )
}
