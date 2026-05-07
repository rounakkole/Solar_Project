import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../App'
import styles from './AdminDashboard.module.css'
import { io } from 'socket.io-client'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// ─── Helpers ─────────────────────────────────────────────────
function tabIcon(t) {
  const icons = { Dashboard:'📊', Customers:'👥', Suppliers:'🏭', Products:'📦', Orders:'🛒', Installations:'🔧', Payments:'💳', Enquiries:'📩' }
  return icons[t] || '📋'
}

const StatusBadge = ({ s }) => {
  const map = {
    active:'badge-green', completed:'badge-green', installed:'badge-green', received:'badge-green',
    pending:'badge-amber', applied:'badge-amber', confirmed:'badge-blue', in_progress:'badge-blue',
    scheduled:'badge-blue', inactive:'badge-red', failed:'badge-red', cancelled:'badge-red',
  }
  return <span className={`badge ${map[s] || 'badge-amber'}`}>{s?.replace('_',' ')}</span>
}

const TABS = ['Dashboard','Customers','Suppliers','Products','Orders','Installations','Payments','Enquiries']

// ─── Reusable Table Wrapper ───────────────────────────────────
function DataTable({ heads, children, loading }) {
  return (
    <div className={styles.tableWrap}>
      {loading && <div className={styles.loading}>Loading data…</div>}
      <table className={styles.table}>
        <thead><tr>{heads.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

// ─── Modal for Add/Edit ───────────────────────────────────────
function AddModal({ title, fields, onSave, onClose, initialData }) {
  const [form, setForm] = useState(initialData || {})

  useEffect(() => {
    setForm(initialData || {})
  }, [initialData])

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3>➕ {title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            {fields.map(f => (
              <div key={f.key} className={styles.mField}>
                <label>{f.label}</label>

                {f.type === 'select'
                  ? (
                    <select
                      value={form[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {f.options?.map(o => <option key={o}>{o}</option>)}
                    </select>
                  )
                  : (
                    <input
                      type={f.type || 'text'}
                      placeholder={f.placeholder || ''}
                      value={form[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  )
                }
              </div>
            ))}
          </div>

          <div className={styles.modalActions}>
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => {
                onSave(form)
                onClose()
              }}
            >
              Save Record
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboard() {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const toast = useToast()
  const [tab, setTab] = useState('Dashboard')
  const [data, setData] = useState({
    customers: [],
    suppliers: [],
    products: [],
    orders: [],
    installations: [],
    payments: [],
    enquiries: [],
  })
  const [loading, setLoading] = useState(false)
  const [addModal, setAddModal] = useState(null)
  const [viewCustomer, setViewCustomer] = useState(null)
  const [viewSupplier, setViewSupplier] = useState(null)
  const [viewProduct, setViewProduct] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [viewEnquiry, setViewEnquiry] = useState(null)
  const [viewInstallation, setViewInstallation] = useState(null)
  const [viewPayment, setViewPayment] = useState(null)

  const handleViewCustomer = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`)
      setViewCustomer(res.data)
    } catch (err) {
      console.error(err)
      toast("Error loading customer ❌")
    }
  }

  const generateInvoice = (order) => {
    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.setTextColor(24, 24, 27)
    doc.text('INVOICE', 14, 22)

    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Order ID: ORD-${String(order.order_id).padStart(3, '0')}`, 14, 32)
    doc.text(`Date: ${order.order_date?.slice(0, 10) || new Date().toISOString().slice(0, 10)}`, 14, 38)
    doc.text(`Status: ${order.status.toUpperCase()}`, 14, 44)

    doc.text('Billed To:', 14, 56)
    doc.setTextColor(24, 24, 27)
    doc.text(order.customer_name || 'Customer', 14, 62)

    doc.autoTable({
      startY: 75,
      head: [['Description', 'Amount']],
      body: [
        [`Order for ${order.customer_name}`, `Rs. ${Number(order.total_amount).toLocaleString('en-IN')}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    })

    const finalY = doc.lastAutoTable.finalY || 75
    doc.setFontSize(14)
    doc.text(`Total: Rs. ${Number(order.total_amount).toLocaleString('en-IN')}`, 14, finalY + 15)

    doc.save(`Invoice_ORD-${String(order.order_id).padStart(3, '0')}.pdf`)
    toast('Invoice downloaded! 📄')
  }

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [cust, supp, prod, ord, inst, pay, enq] = await Promise.all([
        api.get('/customers'),
        api.get('/suppliers'),
        api.get('/products'),
        api.get('/orders'),
        api.get('/installations'),
        api.get('/payments'),
        api.get('/enquiries'),
      ]);

      setData({
        customers: cust.data || [],
        suppliers: supp.data || [],
        products: prod.data?.data || prod.data || [],
        orders: ord.data || [],
        installations: inst.data || [],
        payments: pay.data || [],
        enquiries: enq.data || [],
      });

    } catch (err) {
      console.error("API ERROR:", err.response?.data || err.message);
      toast("Backend error or unauthorized ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const socket = io('http://localhost:5000');
    socket.on('dashboard_update', () => {
      fetchAllData();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleDeleteCustomer = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this customer?")
    if (!confirm) return

    try {
      await api.delete(`/customers/${id}`)
      toast("Customer deleted 🗑")
      fetchAllData()
    } catch (err) {
      console.error(err)
      toast("Cannot delete: Linked data exists ❌")
    }
  }

  const handleViewSupplier = async (id) => {
    try {
      const res = await api.get(`/suppliers/${id}`)
      setViewSupplier(res.data)
    } catch (err) {
      console.error(err)
      toast("Error loading supplier ❌")
    }
  }

  const handleDeleteSupplier = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this supplier?")
    if (!confirm) return

    try {
      await api.delete(`/suppliers/${id}`)
      toast("Supplier deleted 🗑")
      fetchAllData()
    } catch (err) {
      console.error(err)
      toast("Cannot delete: Linked products exist ❌")
    }
  }

  const handleViewProduct = async (id) => {
    try {
      const res = await api.get(`/products/${id}`)
      setViewProduct(res.data)
    } catch (err) {
      console.error(err)
      toast("Error loading product ❌")
    }
  }

  const handleDeleteProduct = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this product?")
    if (!confirm) return

    try {
      await api.delete(`/products/${id}`)
      toast("Product deleted 🗑")
      fetchAllData()
    } catch (err) {
      console.error(err)
      toast("Cannot delete product ❌")
    }
  }

  const handleViewOrder = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`)
      setViewOrder(res.data)
    } catch (err) {
      toast("Error loading order ❌")
    }
  }

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Delete order?")) return
    try {
      await api.delete(`/orders/${id}`)
      toast("Order deleted 🗑")
      fetchAllData()
    } catch (err) {
      toast("Cannot delete order ❌")
    }
  }

  const handleViewEnquiry = async (id) => {
    try {
      const res = await api.get(`/enquiries/${id}`)
      setViewEnquiry(res.data)
    } catch (err) {
      toast("Error loading enquiry ❌")
    }
  }

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm("Delete enquiry?")) return
    try {
      await api.delete(`/enquiries/${id}`)
      toast("Enquiry deleted 🗑")
      fetchAllData()
    } catch (err) {
      toast("Cannot delete enquiry ❌")
    }
  }

  const metrics = [
    { label: 'Total Revenue', value: '₹2.4 Cr', sub: '↑ 18% this month', color: 'var(--primary)' },
    { label: 'Active Orders', value: data.orders?.filter(o => o.status !== 'installed' && o.status !== 'cancelled').length || 0, sub: '↑ 12 new this week', color: '#60A5FA' },
    { label: 'Completed Installs', value: data.installations?.filter(i => i.status === 'completed').length || 0, sub: 'Total finished', color: 'var(--accent)' },
    { label: 'Total Customers', value: data.customers?.length || 0, sub: 'Registered', color: '#A78BFA' },
    { label: 'Pending Enquiries', value: data.enquiries?.filter(e => !e.is_responded).length || 0, sub: 'Needs follow-up', color: 'var(--red)' },
    { label: 'Products in Stock', value: data.products?.reduce((s, p) => s + (+p.stock_quantity || 0), 0) || 0, sub: 'Total units', color: 'var(--primary)' },
  ]

  // Add modals config
  const ADD_CONFIGS = {
    Customers: {
      title: 'New Customer',
      fields: [
        { key: 'name', label: 'Full Name', placeholder: 'Rajesh Kumar' },
        { key: 'email', label: 'Email', placeholder: 'rajesh@email.com' },
        { key: 'phone', label: 'Phone', placeholder: '9876543210' },
        { key: 'address', label: 'Address', placeholder: 'Full address' },
        { key: 'pincode', label: 'Pincode', placeholder: '413501' },
        { key: 'city', label: 'City', placeholder: 'Nagpur' },
        { key: 'property_type', label: 'Property Type', type: 'select', options: ['residential', 'commercial', 'industrial'] },
      ],
      onSave: async (rec) => {
        try {
          await api.post('/customers', rec)
          const res = await api.get('/customers')
          setData(d => ({ ...d, customers: res.data }))
        } catch (err) {
          console.error(err)
          toast("Error adding customer ❌")
        }
      }
    },

    Orders: {
      title: 'New Order',
      fields: [
        { key: 'customer_id', label: 'Customer ID', placeholder: '1' },
        { key: 'system_size_kw', label: 'System Size (kW)', type: 'number', placeholder: '5' },
        { key: 'total_amount', label: 'Total Amount (₹)', type: 'number', placeholder: '247000' },
      ],
      onSave: async (rec) => {
        try {
          await api.post('/orders', rec)
          const res = await api.get('/orders')
          setData(d => ({ ...d, orders: res.data }))
        } catch (err) {
          console.error(err)
          toast("Error adding order ❌")
        }
      }
    },

    Enquiries: {
      title: 'New Enquiry',
      fields: [
        { key: 'name', label: 'Name', placeholder: 'Customer name' },
        { key: 'phone', label: 'Phone', placeholder: '9876543210' },
        { key: 'email', label: 'Email', placeholder: 'email@example.com' },
        { key: 'service_type', label: 'Service', type: 'select', options: ['Residential Solar', 'Commercial Solar', 'Industrial Solar', 'AMC', 'Subsidy Help'] },
        { key: 'monthly_bill', label: 'Monthly Bill', type: 'number', placeholder: '3500' },
      ],
      onSave: async (rec) => {
        try {
          await api.post('/enquiries', rec)
          const res = await api.get('/enquiries')
          setData(d => ({ ...d, enquiries: res.data }))
        } catch (err) {
          console.error(err)
          toast("Error adding enquiry ❌")
        }
      }
    },
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sideLogoWrap}>
          <div className={styles.sideLogo}>☀</div>
          <div>
            <div className={styles.sideLogoText}>SolarTech Pro</div>
            <div className={styles.sideLogoSub}>Admin Panel</div>
          </div>
        </Link>
        <nav className={styles.sideNav}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.navItem} ${tab === t ? styles.navActive : ''}`}
              onClick={() => setTab(t)}
            >
              {tabIcon(t)} {t}
            </button>
          ))}
        </nav>
        <Link to="/" className={styles.sideBack}>← Back to Website</Link>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{tab}</h1>
            <p className={styles.pageSub}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className={styles.topActions}>
            <button className="btn-outline" onClick={() => toast('Data exported!', '⬇')}>⬇ Export CSV</button>
            {ADD_CONFIGS[tab] && (
              <button className="btn-primary" onClick={() => setAddModal(ADD_CONFIGS[tab])}>
                ➕ Add {tab.slice(0, -1)}
              </button>
            )}
            <button className="btn-outline" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* ─── DASHBOARD ─── */}
        {tab === 'Dashboard' && (
          <>
            <div className={styles.metrics}>
              {metrics.map(m => (
                <div key={m.label} className={styles.metricCard}>
                  <div className={styles.mLabel}>{m.label}</div>
                  <div className={styles.mValue} style={{ color: m.color }}>{m.value}</div>
                  <div className={styles.mSub} style={{ color: m.color }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className={styles.dashGrid}>
              <div className={styles.dashCard}>
                <h3>📦 Recent Orders</h3>
                <DataTable heads={['Order', 'Customer', 'Size', 'Amount', 'Status']}>
                  {data.orders?.slice(0, 5).map(o => (
                    <tr key={o.order_id}>
                      <td className={styles.idCell}>ORD-{String(o.order_id).padStart(3, '0')}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.system_size_kw} kW</td>
                      <td>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                      <td><StatusBadge s={o.status} /></td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <div className={styles.dashCard}>
                <h3>📩 Recent Enquiries</h3>
                <DataTable heads={['Name', 'Phone', 'Service', 'Status']}>
                  {data.enquiries?.slice(0, 5).map(e => (
                    <tr key={e.enquiry_id}>
                      <td><strong>{e.name}</strong></td>
                      <td>{e.phone}</td>
                      <td>{e.service_type}</td>
                      <td><StatusBadge s={e.is_responded ? 'completed' : 'pending'} /></td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          </>
        )}

        {/* ─── CUSTOMERS ─── */}
        {tab === 'Customers' && (
          <DataTable loading={loading} heads={['ID', 'Name', 'Email', 'Phone', 'City', 'Type', 'Joined', 'Action']}>
            {data.customers?.map(c => (
              <tr key={c.customer_id}>
                <td className={styles.idCell}>CUS-{String(c.customer_id).padStart(3, '0')}</td>
                <td><strong>{c.name}</strong></td>
                <td className={styles.mutedCell}>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.city}</td>
                <td><span className="badge badge-blue">{c.property_type}</span></td>
                <td className={styles.mutedCell}>{c.created_at?.slice(0, 10)}</td>
                <td>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleViewCustomer(c.customer_id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── SUPPLIERS ─── */}
        {tab === 'Suppliers' && (
          <DataTable loading={loading} heads={['ID', 'Company', 'Contact', 'Email', 'City', 'GST No.', 'Status']}>
            {data.suppliers?.map(s => (
              <tr key={s.supplier_id}>
                <td className={styles.idCell}>SUP-{String(s.supplier_id).padStart(3, '0')}</td>
                <td><strong>{s.company_name}</strong></td>
                <td>{s.contact_person}</td>
                <td className={styles.mutedCell}>{s.email}</td>
                <td>{s.city}</td>
                <td className={styles.mutedCell} style={{ fontSize: '0.75rem' }}>{s.gst_number}</td>
                <td>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleViewSupplier(s.supplier_id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── PRODUCTS ─── */}
        {tab === 'Products' && (
          <DataTable loading={loading} heads={['ID', 'Product Name', 'Category', 'Brand', 'Price', 'Stock', 'Status', 'Action']}>
            {data.products?.map(p => (
              <tr key={p.product_id}>
                <td className={styles.idCell}>PRD-{String(p.product_id).padStart(3, '0')}</td>
                <td><strong>{p.product_name}</strong></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td>{p.brand}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                <td style={{ color: p.stock_quantity > 20 ? 'var(--accent)' : 'var(--red)' }}>{p.stock_quantity}</td>
                <td><StatusBadge s={p.is_active ? 'active' : 'inactive'} /></td>
                <td>
                  <button className={styles.actionBtn} onClick={() => handleViewProduct(p.product_id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── ORDERS ─── */}
        {tab === 'Orders' && (
          <DataTable loading={loading} heads={['Order ID', 'Customer', 'System', 'Amount', 'Date', 'Status', 'Action']}>
            {data.orders?.map(o => (
              <tr key={o.order_id}>
                <td className={styles.idCell} style={{ color: 'var(--primary)' }}>ORD-{String(o.order_id).padStart(3, '0')}</td>
                <td><strong>{o.customer_name}</strong></td>
                <td>{o.system_size_kw ? `${o.system_size_kw} kW` : 'AMC'}</td>
                <td style={{ fontWeight: 700 }}>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                <td className={styles.mutedCell}>{o.order_date?.slice(0, 10)}</td>
                <td><StatusBadge s={o.status} /></td>
                <td>
                  <button className={styles.actionBtn} onClick={() => handleViewOrder(o.order_id)}>View</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── INSTALLATIONS ─── */}
        {tab === 'Installations' && (
          <DataTable loading={loading} heads={['ID', 'Customer', 'City', 'Capacity', 'Technician', 'Completion', 'Status']}>
            {data.installations?.map(i => (
              <tr key={i.installation_id}>
                <td className={styles.idCell}>INST-{String(i.installation_id).padStart(3, '0')}</td>
                <td><strong>{i.customer_name}</strong></td>
                <td>{i.city}</td>
                <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{i.total_kw} kW</td>
                <td>{i.technician_name}</td>
                <td className={styles.mutedCell}>{i.completion_date?.slice(0, 10) || '—'}</td>
                <td><StatusBadge s={i.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── PAYMENTS ─── */}
        {tab === 'Payments' && (
          <DataTable loading={loading} heads={['Pay ID', 'Order', 'Customer', 'Amount', 'Method', 'Date', 'Status']}>
            {data.payments?.map(p => (
              <tr key={p.payment_id}>
                <td className={styles.idCell} style={{ color: 'var(--primary)' }}>PAY-{String(p.payment_id).padStart(3, '0')}</td>
                <td>ORD-{String(p.order_id).padStart(3, '0')}</td>
                <td><strong>{p.customer_name}</strong></td>
                <td style={{ fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                <td><span className="badge badge-blue">{p.method?.toUpperCase()}</span></td>
                <td className={styles.mutedCell}>{p.payment_date?.slice(0, 10)}</td>
                <td><StatusBadge s={p.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── ENQUIRIES ─── */}
        {tab === 'Enquiries' && (
          <DataTable loading={loading} heads={['ID', 'Name', 'Email', 'Phone', 'City', 'Service', 'Amount/Bill', 'Date', 'Responded']}>
            {data.enquiries?.map(e => (
              <tr key={e.enquiry_id}>
                <td className={styles.idCell}>ENQ-{String(e.enquiry_id).padStart(3, '0')}</td>
                <td><strong>{e.name}</strong></td>
                <td className={styles.mutedCell}>{e.email}</td>
                <td>{e.phone}</td>
                <td>{e.city || '—'}</td>
                <td style={{ fontSize: '0.8rem' }}>{e.service_type}</td>
                <td style={{ color: 'var(--primary)' }}>
                  {e.monthly_bill ? `₹${Number(e.monthly_bill).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className={styles.mutedCell}>{e.submitted_at?.slice(0, 10)}</td>
                <td>
                  <StatusBadge s={e.is_responded ? 'completed' : 'pending'} />
                </td>
                <td>
                  <button className={styles.actionBtn} onClick={() => handleViewEnquiry(e.enquiry_id)}>View</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </main>

      {/* CUSTOMER MODAL */}
      {viewCustomer && (
        <div className={styles.overlay} onClick={() => setViewCustomer(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>👤 Customer Details</h3>
              <button className={styles.closeBtn} onClick={() => setViewCustomer(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.mField}>
                  <label>Name</label>
                  <input value={viewCustomer.name || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Email</label>
                  <input value={viewCustomer.email || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Phone</label>
                  <input value={viewCustomer.phone || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Address</label>
                  <input value={viewCustomer.address || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>City</label>
                  <input value={viewCustomer.city || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Pincode</label>
                  <input value={viewCustomer.pincode || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Property Type</label>
                  <input value={viewCustomer.property_type || ''} readOnly />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className="btn-outline"
                  style={{ color: 'red' }}
                  onClick={() => handleDeleteCustomer(viewCustomer.customer_id)}
                >
                  Delete
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setAddModal({
                      title: "Edit Customer",
                      fields: [
                        { key: 'name', label: 'Full Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'address', label: 'Address' },
                        { key: 'pincode', label: 'Pincode' },
                        { key: 'city', label: 'City' },
                        { key: 'property_type', label: 'Property Type', type: 'select', options: ['residential', 'commercial', 'industrial'] },
                      ],
                      initialData: viewCustomer,
                      onSave: async (rec) => {
                        try {
                          await api.put(`/customers/${viewCustomer.customer_id}`, rec)
                          toast("Updated ✅")
                          setViewCustomer(null)
                          fetchAllData()
                        } catch (err) {
                          toast("Update failed ❌")
                        }
                      }
                    })
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER MODAL */}
      {viewSupplier && (
        <div className={styles.overlay} onClick={() => setViewSupplier(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>🏭 Supplier Details</h3>
              <button className={styles.closeBtn} onClick={() => setViewSupplier(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.mField}>
                  <label>Company</label>
                  <input value={viewSupplier.company_name || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Contact Person</label>
                  <input value={viewSupplier.contact_person || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Email</label>
                  <input value={viewSupplier.email || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Phone</label>
                  <input value={viewSupplier.phone || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>City</label>
                  <input value={viewSupplier.city || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>GST Number</label>
                  <input value={viewSupplier.gst_number || ''} readOnly />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className="btn-outline"
                  style={{
                    color: viewSupplier.products?.length ? 'gray' : 'red',
                    cursor: viewSupplier.products?.length ? 'not-allowed' : 'pointer'
                  }}
                  disabled={viewSupplier.products?.length > 0}
                  onClick={() => handleDeleteSupplier(viewSupplier.supplier_id)}
                >
                  Delete
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setAddModal({
                      title: "Edit Supplier",
                      fields: [
                        { key: 'company_name', label: 'Company Name' },
                        { key: 'contact_person', label: 'Contact Person' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'city', label: 'City' },
                        { key: 'gst_number', label: 'GST Number' },
                      ],
                      initialData: viewSupplier,
                      onSave: async (rec) => {
                        try {
                          await api.put(`/suppliers/${viewSupplier.supplier_id}`, rec)
                          toast("Updated ✅")
                          setViewSupplier(null)
                          fetchAllData()
                        } catch (err) {
                          toast("Update failed ❌")
                        }
                      }
                    })
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {viewProduct && (
        <div className={styles.overlay} onClick={() => setViewProduct(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>📦 Product Details</h3>
              <button className={styles.closeBtn} onClick={() => setViewProduct(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.mField}>
                  <label>Product Name</label>
                  <input value={viewProduct.product_name || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Category</label>
                  <input value={viewProduct.category || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Brand</label>
                  <input value={viewProduct.brand || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Price</label>
                  <input value={viewProduct.price || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Stock</label>
                  <input value={viewProduct.stock_quantity || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Status</label>
                  <input value={viewProduct.is_active ? 'Active' : 'Inactive'} readOnly />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className="btn-outline"
                  style={{ color: 'red' }}
                  onClick={() => handleDeleteProduct(viewProduct.product_id)}
                >
                  Delete
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setAddModal({
                      title: "Edit Product",
                      fields: [
                        { key: 'product_name', label: 'Product Name' },
                        { key: 'category', label: 'Category' },
                        { key: 'brand', label: 'Brand' },
                        { key: 'price', label: 'Price', type: 'number' },
                        { key: 'stock_quantity', label: 'Stock', type: 'number' },
                        { key: 'is_active', label: 'Status', type: 'select', options: [true, false] },
                      ],
                      initialData: viewProduct,
                      onSave: async (rec) => {
                        try {
                          await api.put(`/products/${viewProduct.product_id}`, rec)
                          toast("Updated ✅")
                          setViewProduct(null)
                          fetchAllData()
                        } catch (err) {
                          toast("Update failed ❌")
                        }
                      }
                    })
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER MODAL */}
      {viewOrder && (
        <div className={styles.overlay} onClick={() => setViewOrder(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>🛒 Order Details</h3>
              <button className={styles.closeBtn} onClick={() => setViewOrder(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.mField}>
                  <label>Order ID</label>
                  <input value={`ORD-${String(viewOrder.order_id).padStart(3, '0')}`} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Customer</label>
                  <input value={viewOrder.customer_name || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Amount (₹)</label>
                  <input value={viewOrder.total_amount || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Status</label>
                  <input value={viewOrder.status || ''} readOnly />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className="btn-outline"
                  style={{ color: 'red' }}
                  onClick={() => handleDeleteOrder(viewOrder.order_id)}
                >
                  Delete
                </button>

                <button
                  className="btn-outline"
                  onClick={() => generateInvoice(viewOrder)}
                >
                  Download Invoice
                </button>

                {viewOrder.status !== 'confirmed' && viewOrder.status !== 'completed' && viewOrder.status !== 'installed' && (
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      try {
                        // Initialize payment
                        const { data } = await api.post('/razorpay/init', {
                          order_id: viewOrder.order_id,
                          amount: viewOrder.total_amount,
                          customer_id: viewOrder.customer_id,
                          description: `Order ${viewOrder.order_id}`
                        });

                        const options = {
                          key: data.data.key_id || 'rzp_test_YOUR_KEY',
                          amount: data.data.amount * 100,
                          currency: "INR",
                          name: "SolarTech Pro",
                          description: `Payment for ORD-${viewOrder.order_id}`,
                          order_id: data.data.razorpay_order_id,
                          handler: async function (response) {
                            try {
                              console.log("PAYMENT RESPONSE:", response)

                              const verifyRes = await api.post('/razorpay/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_id: viewOrder.order_id,
                                customer_id: viewOrder.customer_id,
                                amount: viewOrder.total_amount
                              })

                              console.log("VERIFY RESPONSE:", verifyRes.data)
                              toast('Payment Successful ✅')

                              // Refresh orders
                              fetchAllData()

                              // Close modal
                              setViewOrder(null)

                            } catch (err) {
                              console.log("VERIFY ERROR:", err.response?.data || err)
                              toast('Payment verification failed ❌')
                            }
                          }
                        };

                        // Initialize Razorpay
                        if (window.Razorpay) {
                          const rzp = new window.Razorpay(options);
                          rzp.open();
                        }
                      } catch (err) {
                        console.error(err)
                        toast('Payment initialization failed ❌')
                      }
                    }}
                  >
                    Pay Now (Razorpay)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENQUIRY MODAL */}
      {viewEnquiry && (
        <div className={styles.overlay} onClick={() => setViewEnquiry(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>📩 Enquiry Details</h3>
              <button className={styles.closeBtn} onClick={() => setViewEnquiry(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.mField}>
                  <label>Name</label>
                  <input value={viewEnquiry.name || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Email</label>
                  <input value={viewEnquiry.email || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Phone</label>
                  <input value={viewEnquiry.phone || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Service Type</label>
                  <input value={viewEnquiry.service_type || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Monthly Bill</label>
                  <input value={viewEnquiry.monthly_bill || ''} readOnly />
                </div>
                <div className={styles.mField}>
                  <label>Status</label>
                  <input value={viewEnquiry.is_responded ? 'Completed' : 'Pending'} readOnly />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className="btn-outline"
                  style={{ color: 'red' }}
                  onClick={() => handleDeleteEnquiry(viewEnquiry.enquiry_id)}
                >
                  Delete
                </button>

                <button
                  className="btn-primary"
                  onClick={async () => {
                    try {
                      await api.patch(`/enquiries/${viewEnquiry.enquiry_id}/respond`, { assigned_to: 'Admin' });
                      toast('Enquiry status updated! ✅');
                      setViewEnquiry(null);
                      fetchAllData();
                    } catch (err) {
                      toast('Failed to update enquiry ❌');
                    }
                  }}
                >
                  Toggle Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <AddModal
          title={addModal.title}
          fields={addModal.fields}
          initialData={addModal.initialData}
          onClose={() => setAddModal(null)}
          onSave={(rec) => {
            addModal.onSave(rec);
          }}
        />
      )}
    </div>
  )
}
