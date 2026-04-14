const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Use Gmail App Password
  },
})

// ─── Email Templates ──────────────────────────────────────────
function enquiryConfirmationHTML(data) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0F1E;color:#F9FAFB;border-radius:12px;overflow:hidden">
    <div style="background:#F59E0B;padding:20px 30px">
      <h1 style="margin:0;color:#000;font-size:1.3rem">☀ SolarTech Pro — Enquiry Received</h1>
    </div>
    <div style="padding:30px">
      <p>Dear <strong>${data.name}</strong>,</p>
      <p>Thank you for contacting SolarTech Pro! We have received your enquiry and our solar expert will call you within <strong style="color:#F59E0B">24 hours</strong>.</p>
      <div style="background:#1F2937;border-radius:8px;padding:16px;margin:20px 0">
        <h3 style="margin:0 0 12px;color:#F59E0B">Your Enquiry Summary</h3>
        <table style="width:100%;font-size:0.88rem">
          <tr><td style="color:#9CA3AF;padding:4px 0">Service</td><td>${data.service_type}</td></tr>
          <tr><td style="color:#9CA3AF;padding:4px 0">Monthly Bill</td><td>₹${data.monthly_bill || 'Not provided'}</td></tr>
          <tr><td style="color:#9CA3AF;padding:4px 0">City</td><td>${data.city || 'Not provided'}</td></tr>
          <tr><td style="color:#9CA3AF;padding:4px 0">Reference ID</td><td style="color:#10B981">ENQ-${Date.now().toString().slice(-6)}</td></tr>
        </table>
      </div>
      <p>Our team will contact you on <strong>${data.phone}</strong>.</p>
      <a href="https://solartechpro.in/calculator" style="display:inline-block;background:#F59E0B;color:#000;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px">
        ⚡ Calculate Your Savings
      </a>
    </div>
    <div style="padding:16px 30px;border-top:1px solid #374151;font-size:0.78rem;color:#6B7280">
      SolarTech Pro · Plot 45, MIDC Nagpur · +91 98765 43210 · info@solartechpro.in
    </div>
  </div>`
}

function orderConfirmationHTML(order, customer) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0F1E;color:#F9FAFB;border-radius:12px;overflow:hidden">
    <div style="background:#F59E0B;padding:20px 30px">
      <h1 style="margin:0;color:#000;font-size:1.3rem">☀ SolarTech Pro — Order Confirmed</h1>
    </div>
    <div style="padding:30px">
      <p>Dear <strong>${customer.name}</strong>,</p>
      <p>Your solar order has been <strong style="color:#10B981">confirmed!</strong> Our installation team will contact you shortly.</p>
      <div style="background:#1F2937;border-radius:8px;padding:16px;margin:20px 0">
        <h3 style="margin:0 0 12px;color:#F59E0B">Order Details — ORD-${String(order.order_id).padStart(3,'0')}</h3>
        <table style="width:100%;font-size:0.88rem">
          <tr><td style="color:#9CA3AF;padding:4px 0">System Size</td><td>${order.system_size_kw} kW</td></tr>
          <tr><td style="color:#9CA3AF;padding:4px 0">Total Amount</td><td style="color:#F59E0B;font-weight:700">₹${Number(order.total_amount).toLocaleString('en-IN')}</td></tr>
          <tr><td style="color:#9CA3AF;padding:4px 0">Govt. Subsidy</td><td style="color:#10B981">₹${Number(order.subsidy_amount).toLocaleString('en-IN')}</td></tr>
        </table>
      </div>
    </div>
    <div style="padding:16px 30px;border-top:1px solid #374151;font-size:0.78rem;color:#6B7280">
      SolarTech Pro · Plot 45, MIDC Nagpur · +91 98765 43210
    </div>
  </div>`
}

// ─── Send Functions ───────────────────────────────────────────
async function sendEnquiryConfirmation(enquiry) {
  if (!process.env.EMAIL_USER) return  // Skip if email not configured
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      enquiry.email,
      subject: '✅ Enquiry Received — SolarTech Pro',
      html:    enquiryConfirmationHTML(enquiry),
    })
    // Also notify internal team
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      process.env.EMAIL_USER,
      subject: `🔔 New Enquiry: ${enquiry.name} — ${enquiry.service_type}`,
      html:    `<p>New enquiry from <strong>${enquiry.name}</strong> (${enquiry.phone})<br>Service: ${enquiry.service_type}<br>City: ${enquiry.city}</p>`,
    })
    console.log('📧 Email sent to:', enquiry.email)
  } catch (err) {
    console.error('❌ Email failed:', err.message)
  }
}

async function sendOrderConfirmation(order, customer) {
  if (!process.env.EMAIL_USER || !customer.email) return
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      customer.email,
      subject: `✅ Order Confirmed ORD-${String(order.order_id).padStart(3,'0')} — SolarTech Pro`,
      html:    orderConfirmationHTML(order, customer),
    })
  } catch (err) {
    console.error('❌ Order email failed:', err.message)
  }
}

module.exports = { sendEnquiryConfirmation, sendOrderConfirmation }
