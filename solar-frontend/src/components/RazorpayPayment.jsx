import React, { useEffect, useState } from 'react'
import axios from 'axios'
import qrImage from '../assets/payment-qr.jpeg'

export default function RazorpayPayment({
  orderId,
  amount,
  customerId,
  customerPhone,
  onSuccess
}) {

  const [paymentMethod, setPaymentMethod] = useState('')

  const loadRazorpayScript = async () => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }

  useEffect(() => {
    loadRazorpayScript()
  }, [])

  const paymentSuccess = async () => {
    try {

      // Save payment in database
      await axios.post('/api/payments/success', {
        order_id: orderId,
        customer_id: customerId,
        amount
      })

      // Send SMS
      await axios.post('/api/send-sms', {
        phone: customerPhone,
        message: `Your transaction was successful for Order #${orderId}. Thank you for your payment.`
      })

      alert('Payment Successful')

      onSuccess()

    } catch (error) {
      console.log(error)
      alert('Something went wrong')
    }
  }

  const initiateCardPayment = async () => {
    try {

      const response = await axios.post('/api/payments/razorpay/init', {
        order_id: orderId,
        amount
      })

      const options = {
        key: response.data.data.key_id,
        amount: amount * 100,
        currency: 'INR',
        name: 'SolarTech Solutions',
        order_id: response.data.data.razorpay_order_id,

        handler: async function () {
          await paymentSuccess()
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>

      <h3>Select Payment Method</h3>

      <button onClick={() => setPaymentMethod('upi')}>
        Bank / UPI Payment
      </button>

      <button onClick={() => {
        setPaymentMethod('card')
        initiateCardPayment()
      }}>
        Card Payment
      </button>

      {/* QR CODE */}
      {paymentMethod === 'upi' && (
        <div style={{ marginTop: '20px' }}>

          <img
            src={qrImage}
            alt="QR Code"
            width="300"
            style={{
              borderRadius: '10px',
              border: '1px solid #ddd'
            }}
          />

          <p>
            Scan QR Code and complete payment
          </p>

          <button onClick={paymentSuccess}>
            I Have Completed Payment
          </button>

        </div>
      )}

    </div>
  )
}