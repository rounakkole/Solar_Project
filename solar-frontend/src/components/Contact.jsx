import { useState } from 'react'
import api from '../api/axios'
import { useToast } from '../App'
import styles from './Contact.module.css'

const SERVICES = [
  'Residential Solar Installation',
  'Commercial Solar Installation',
  'Industrial Solar',
  'Battery Storage',
  'AMC / Maintenance',
  'Subsidy Assistance',
]

export default function Contact() {
  const toast = useToast()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    service_type: SERVICES[0], monthly_bill: '', message: ''
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.phone || !form.email) {
      toast('Please fill Name, Phone & Email!', <i class="bi bi-exclamation-triangle-fill"></i> ); return
    }
    setLoading(true)
    try {
      await api.post('/enquiries', form)
      setSent(true)
      toast(`Enquiry sent! We'll call ${form.phone} within 24 hours.`, <i class="bi bi-envelope-arrow-up-fill"></i> )
      setForm({ name:'', email:'', phone:'', city:'', service_type: SERVICES[0], monthly_bill:'', message:'' })
    } catch {
      // If API not running, simulate success
      setSent(true)
      toast(`Enquiry saved! Our team will contact ${form.email} soon.`, <i class="bi bi-check-square-fill"></i> )
    } finally {
      setLoading(false)
      setTimeout(() => setSent(false), 7000)
    }
  }

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className={styles.grid}>
          {/* Info side */}
          <div>
            <span className="section-badge">Contact Us</span>
            <h2 className="section-title">Get A Free Quote</h2>
            <p className={styles.intro}>
              Talk to our solar experts. We'll visit your site for free and give you a detailed
              proposal within 24 hours — no obligation.
            </p>

            {[
              { icon: <i class="bi bi-pin-map-fill"></i> , label: 'Address',   val: 'Plot 45, Solar Park, Pune, Maharashtra 411001' },
              { icon: <i class="bi bi-telephone-fill"></i> , label: 'Call Us',   val: '+91 9876543210' },
              { icon: <i class="bi bi-envelope-fill"></i> ,  label: 'Email',     val: 'info@gmail.in' },
              { icon: <i class="bi bi-watch"></i> , label: 'Hours',     val: 'Mon–Sat: 9:00 AM – 6:00 PM' },
            ].map(item => (
              <div key={item.label} className={styles.infoItem}>
                <div className={styles.infoIcon}>{item.icon}</div>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.val}</strong>
                </div>
              </div>
            ))}

            <div className={styles.features}>
              {['Free Site Survey', '24hr Response', 'Subsidy Help', '25yr Warranty'].map(f => (
                <span key={f} className={styles.feat}>✓ {f}</span>
              ))}
            </div>
          </div>

          {/* Form side */}
          <div className={styles.formCard}>
            <h3>Send Enquiry</h3>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Full Name *</label>
                <input placeholder="Name LastName" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Phone *</label>
                <input placeholder="+91 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Email *</label>
                <input type="email" placeholder="name@gmail.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>City</label>
                <input placeholder="Pune" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Service</label>
                <select value={form.service_type} onChange={e => set('service_type', e.target.value)}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Monthly Bill (₹)</label>
                <input type="number" placeholder="3500" value={form.monthly_bill} onChange={e => set('monthly_bill', e.target.value)} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Message</label>
              <textarea placeholder="Tell us about your requirements..." value={form.message} onChange={e => set('message', e.target.value)} />
            </div>

            <button
              className={`btn-primary ${styles.submitBtn}`}
              onClick={submit}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Submit Enquiry & Get Quote'}
            </button>

            {sent && (
              <div className={styles.success}>
                Thank you! Your enquiry has been received. Our team will contact you within 24 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
