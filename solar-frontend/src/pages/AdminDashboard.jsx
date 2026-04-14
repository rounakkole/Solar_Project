import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../App'
import styles from './AdminDashboard.module.css'

// ─── Helpers ─────────────────────────────────────────────────
const StatusBadge = ({ s }) => {
  const map = {
    active:'badge-green', completed:'badge-green', installed:'badge-green', received:'badge-green',
    pending:'badge-amber', applied:'badge-amber', confirmed:'badge-blue', in_progress:'badge-blue',
    scheduled:'badge-blue', inactive:'badge-red', failed:'badge-red', cancelled:'badge-red',
  }
  return <span className={`badge ${map[s] || 'badge-amber'}`}>{s?.replace('_',' ')}</span>
}

const TABS = ['Dashboard','Customers','Suppliers','Products','Orders','Installations','Payments','Enquiries']

// ─── Seed data (used when API not running) ───────────────────
const SEED = {
  customers: [
    { customer_id:1, name:'Rajesh Kumar',  email:'rajesh@email.com', phone:'9876543210', city:'Nagpur',  property_type:'residential', created_at:'2025-03-01' },
    { customer_id:2, name:'Priya Sharma',  email:'priya@email.com',  phone:'9765432109', city:'Pune',    property_type:'commercial',  created_at:'2025-03-05' },
    { customer_id:3, name:'Amit Patel',    email:'amit@email.com',   phone:'9654321098', city:'Mumbai',  property_type:'industrial',  created_at:'2025-03-10' },
    { customer_id:4, name:'Sunita Verma',  email:'sunita@email.com', phone:'9543210987', city:'Nashik',  property_type:'residential', created_at:'2025-03-15' },
    { customer_id:5, name:'Deepak Joshi',  email:'deepak@email.com', phone:'9432109876', city:'Nagpur',  property_type:'residential', created_at:'2025-03-18' },
  ],
  suppliers: [
    { supplier_id:1, company_name:'Waaree Energies Ltd',  contact_person:'Mr. Patil', email:'patil@waaree.com',   phone:'9800000001', city:'Surat',   gst_number:'27AABCW5678G1Z1', status:'active' },
    { supplier_id:2, company_name:'Luminous Power Tech',  contact_person:'Mr. Gupta', email:'gupta@luminous.com', phone:'9800000002', city:'Delhi',   gst_number:'07AABCL9012H2Z2', status:'active' },
    { supplier_id:3, company_name:'Tata Power Solar',     contact_person:'Ms. Singh', email:'singh@tata.com',     phone:'9800000003', city:'Mumbai',  gst_number:'27AABCT3456I3Z3', status:'active' },
    { supplier_id:4, company_name:'Nexus Metal Struct',   contact_person:'Mr. Desai', email:'desai@nexus.com',    phone:'9800000004', city:'Pune',    gst_number:'27AABCN7890J4Z4', status:'active' },
  ],
  products: [
    { product_id:1, product_name:'Mono PERC Panel 400W', category:'panel',    brand:'Waaree',   price:18500, stock_quantity:150, is_active:true },
    { product_id:2, product_name:'Poly Panel 330W',       category:'panel',    brand:'Waaree',   price:14200, stock_quantity:200, is_active:true },
    { product_id:3, product_name:'Hybrid Inverter 5kW',   category:'inverter', brand:'Luminous', price:32000, stock_quantity:40,  is_active:true },
    { product_id:4, product_name:'Lithium Battery 5kWh',  category:'battery',  brand:'Exide',    price:85000, stock_quantity:20,  is_active:true },
  ],
  orders: [
    { order_id:1, customer_name:'Rajesh Kumar', system_size_kw:5,  total_amount:247000, order_date:'2025-03-15', status:'installed' },
    { order_id:2, customer_name:'Priya Sharma', system_size_kw:10, total_amount:485000, order_date:'2025-03-18', status:'confirmed' },
    { order_id:3, customer_name:'Amit Patel',   system_size_kw:50, total_amount:2250000,order_date:'2025-03-20', status:'pending'   },
    { order_id:4, customer_name:'Sunita Verma', system_size_kw:3,  total_amount:158000, order_date:'2025-03-22', status:'installed' },
    { order_id:5, customer_name:'Deepak Joshi', system_size_kw:0,  total_amount:18000,  order_date:'2025-03-25', status:'confirmed' },
  ],
  installations: [
    { installation_id:1, customer_name:'Rajesh Kumar', city:'Nagpur', total_kw:5,  technician_name:'Ravi Yadav',   completion_date:'2025-03-18', status:'completed'   },
    { installation_id:2, customer_name:'Sunita Verma', city:'Nashik', total_kw:3,  technician_name:'Suresh Pawar', completion_date:'2025-03-25', status:'completed'   },
    { installation_id:3, customer_name:'Priya Sharma', city:'Pune',   total_kw:10, technician_name:'Vikram Nair',  completion_date:null,          status:'in_progress' },
    { installation_id:4, customer_name:'Amit Patel',   city:'Mumbai', total_kw:50, technician_name:'Team Alpha',   completion_date:null,          status:'scheduled'   },
  ],
  payments: [
    { payment_id:1, order_id:1, customer_name:'Rajesh Kumar', amount:247000, method:'neft',  payment_date:'2025-03-16', status:'completed' },
    { payment_id:2, order_id:2, customer_name:'Priya Sharma', amount:200000, method:'rtgs',  payment_date:'2025-03-19', status:'completed' },
    { payment_id:3, order_id:3, customer_name:'Amit Patel',   amount:500000, method:'cheque',payment_date:'2025-03-21', status:'pending'   },
    { payment_id:4, order_id:4, customer_name:'Sunita Verma', amount:158000, method:'upi',   payment_date:'2025-03-22', status:'completed' },
  ],
  enquiries: [
    { enquiry_id:1, name:'Rohit Agrawal', email:'rohit@email.com', phone:'9100000001', city:'Nagpur', service_type:'Residential Solar', monthly_bill:3500, submitted_at:'2025-03-28', is_responded:false },
    { enquiry_id:2, name:'Neha Kulkarni', email:'neha@email.com',  phone:'9100000002', city:'Pune',   service_type:'Commercial Solar',  monthly_bill:12000, submitted_at:'2025-03-29', is_responded:true },
    { enquiry_id:3, name:'Raju Thorat',   email:'raju@email.com',  phone:'9100000003', city:'Nashik', service_type:'Subsidy Help',      monthly_bill:2800, submitted_at:'2025-03-30', is_responded:false },
  ],
}

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
function AddModal({ title, fields, onSave, onClose }) {
  const [form, setForm] = useState({})
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
                  ? <select value={form[f.key]||''} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}>
                      {f.options.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : <input type={f.type||'text'} placeholder={f.placeholder||''} value={form[f.key]||''}
                      onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} />
                }
              </div>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => { onSave(form); onClose() }}>Save Record</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboard() {
  const toast = useToast()
  const [tab, setTab]           = useState('Dashboard')
  const [data, setData]         = useState(SEED)
  const [loading, setLoading]   = useState(false)
  const [addModal, setAddModal] = useState(null)

  // Try to fetch from real API
  useEffect(() => {
  const load = async () => {
    setLoading(true);

    try {
      const [cust, supp, prod, ord, inst, pay, enq] = await Promise.all([
        api.get('/customers'),
        api.get('/suppliers'),
        api.get('/products'),
        api.get('/orders/summary'),
        api.get('/installations/summary'),
        api.get('/payments/summary'),
        api.get('/enquiries'),
      ]);

      setData({
        customers: cust.data,
        suppliers: supp.data,
        products: prod.data,
        orders: ord.data,
        installations: inst.data,
        payments: pay.data,
        enquiries: enq.data,
      });

    } catch (err) {
      console.error("Backend failed:", err);
      toast("Using demo data (backend issue)", "⚠");
      setData(SEED);
    } finally {
      setLoading(false);
    }
  };

  load();
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

  const metrics = [
    { label: 'Total Revenue',     value: '₹2.4 Cr',  sub: '↑ 18% this month',  color: 'var(--primary)' },
    { label: 'Active Orders',     value: data.orders?.filter(o=>o.status!=='installed'&&o.status!=='cancelled').length || 0, sub: '↑ 12 new this week', color: '#60A5FA' },
    { label: 'Completed Installs',value: data.installations?.filter(i=>i.status==='completed').length || 0,  sub: 'Total finished',  color: 'var(--accent)' },
    { label: 'Total Customers',   value: data.customers?.length || 0,  sub: 'Registered', color: '#A78BFA' },
    { label: 'Pending Enquiries', value: data.enquiries?.filter(e=>!e.is_responded).length || 0, sub: 'Needs follow-up', color: 'var(--red)' },
    { label: 'Products in Stock', value: data.products?.reduce((s,p)=>s+(+p.stock_quantity||0),0) || 0, sub: 'Total units', color: 'var(--primary)' },
  ]

  // Add modals config
  const ADD_CONFIGS = {
    Customers: {
      title: 'New Customer',
      fields: [
        { key:'name',          label:'Full Name',       placeholder:'Rajesh Kumar' },
        { key:'email',         label:'Email',           placeholder:'rajesh@email.com' },
        { key:'phone',         label:'Phone',           placeholder:'9876543210' },
        { key:'city',          label:'City',            placeholder:'Nagpur' },
        { key:'property_type', label:'Property Type',   type:'select', options:['residential','commercial','industrial'] },
      ],
      onSave: rec => setData(d => ({ ...d, customers: [...d.customers, { ...rec, customer_id: Date.now() }] }))
    },
    Orders: {
      title: 'New Order',
      fields: [
        { key:'customer_name',   label:'Customer Name',   placeholder:'Rajesh Kumar' },
        { key:'system_size_kw',  label:'System Size (kW)',type:'number', placeholder:'5' },
        { key:'total_amount',    label:'Total Amount (₹)',type:'number', placeholder:'247000' },
        { key:'status',          label:'Status',          type:'select', options:['pending','confirmed','installed','cancelled'] },
      ],
      onSave: rec => setData(d => ({ ...d, orders: [...d.orders, { ...rec, order_id: Date.now(), order_date: new Date().toISOString().slice(0,10) }] }))
    },
    Enquiries: {
      title: 'New Enquiry',
      fields: [
        { key:'name',         label:'Name',         placeholder:'Customer name' },
        { key:'phone',        label:'Phone',        placeholder:'9876543210' },
        { key:'email',        label:'Email',        placeholder:'email@example.com' },
        { key:'service_type', label:'Service',      type:'select', options:['Residential Solar','Commercial Solar','Industrial Solar','AMC','Subsidy Help'] },
        { key:'monthly_bill', label:'Monthly Bill', type:'number', placeholder:'3500' },
      ],
      onSave: rec => setData(d => ({ ...d, enquiries: [...d.enquiries, { ...rec, enquiry_id: Date.now(), submitted_at: new Date().toISOString().slice(0,10), is_responded: false }] }))
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
              {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div className={styles.topActions}>
            <button className="btn-outline" onClick={() => toast('Data exported!', '⬇')}>⬇ Export CSV</button>
            {ADD_CONFIGS[tab] && (
              <button className="btn-primary" onClick={() => setAddModal(ADD_CONFIGS[tab])}>
                ➕ Add {tab.slice(0,-1)}
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
                <DataTable heads={['Order','Customer','Size','Amount','Status']}>
                  {data.orders?.slice(0,5).map(o => (
                    <tr key={o.order_id}>
                      <td className={styles.idCell}>ORD-{String(o.order_id).padStart(3,'0')}</td>
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
                <DataTable heads={['Name','Phone','Service','Status']}>
                  {data.enquiries?.slice(0,5).map(e => (
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
          <DataTable loading={loading} heads={['ID','Name','Email','Phone','City','Type','Joined','Action']}>
            {data.customers?.map(c => (
              <tr key={c.customer_id}>
                <td className={styles.idCell}>CUS-{String(c.customer_id).padStart(3,'0')}</td>
                <td><strong>{c.name}</strong></td>
                <td className={styles.mutedCell}>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.city}</td>
                <td><span className="badge badge-blue">{c.property_type}</span></td>
                <td className={styles.mutedCell}>{c.created_at?.slice(0,10)}</td>
                <td>
                  <button className={styles.actionBtn} onClick={() => toast(`Viewing ${c.name}`, '👁')}>View</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── SUPPLIERS ─── */}
        {tab === 'Suppliers' && (
          <DataTable loading={loading} heads={['ID','Company','Contact','Email','City','GST No.','Status']}>
            {data.suppliers?.map(s => (
              <tr key={s.supplier_id}>
                <td className={styles.idCell}>SUP-{String(s.supplier_id).padStart(3,'0')}</td>
                <td><strong>{s.company_name}</strong></td>
                <td>{s.contact_person}</td>
                <td className={styles.mutedCell}>{s.email}</td>
                <td>{s.city}</td>
                <td className={styles.mutedCell} style={{ fontSize:'0.75rem' }}>{s.gst_number}</td>
                <td><StatusBadge s={s.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── PRODUCTS ─── */}
        {tab === 'Products' && (
          <DataTable loading={loading} heads={['ID','Product Name','Category','Brand','Price','Stock','Status','Action']}>
            {data.products?.map(p => (
              <tr key={p.product_id}>
                <td className={styles.idCell}>PRD-{String(p.product_id).padStart(3,'0')}</td>
                <td><strong>{p.product_name}</strong></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td>{p.brand}</td>
                <td style={{ color:'var(--primary)', fontWeight:700 }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                <td style={{ color: p.stock_quantity > 20 ? 'var(--accent)' : 'var(--red)' }}>{p.stock_quantity}</td>
                <td><StatusBadge s={p.is_active ? 'active' : 'inactive'} /></td>
                <td>
                  <button className={styles.actionBtn} onClick={() => toast(`Editing ${p.product_name}`, '✏️')}>Edit</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── ORDERS ─── */}
        {tab === 'Orders' && (
          <DataTable loading={loading} heads={['Order ID','Customer','System','Amount','Date','Status','Invoice']}>
            {data.orders?.map(o => (
              <tr key={o.order_id}>
                <td className={styles.idCell} style={{ color:'var(--primary)' }}>ORD-{String(o.order_id).padStart(3,'0')}</td>
                <td><strong>{o.customer_name}</strong></td>
                <td>{o.system_size_kw ? `${o.system_size_kw} kW` : 'AMC'}</td>
                <td style={{ fontWeight:700 }}>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                <td className={styles.mutedCell}>{o.order_date?.slice(0,10)}</td>
                <td><StatusBadge s={o.status} /></td>
                <td>
                  <button className={styles.actionBtn} onClick={() => toast(`Invoice ORD-${o.order_id} generated`, '📄')}>Invoice</button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── INSTALLATIONS ─── */}
        {tab === 'Installations' && (
          <DataTable loading={loading} heads={['ID','Customer','City','Capacity','Technician','Completion','Status']}>
            {data.installations?.map(i => (
              <tr key={i.installation_id}>
                <td className={styles.idCell}>INST-{String(i.installation_id).padStart(3,'0')}</td>
                <td><strong>{i.customer_name}</strong></td>
                <td>{i.city}</td>
                <td style={{ color:'var(--accent)', fontWeight:600 }}>{i.total_kw} kW</td>
                <td>{i.technician_name}</td>
                <td className={styles.mutedCell}>{i.completion_date?.slice(0,10) || '—'}</td>
                <td><StatusBadge s={i.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── PAYMENTS ─── */}
        {tab === 'Payments' && (
          <DataTable loading={loading} heads={['Pay ID','Order','Customer','Amount','Method','Date','Status']}>
            {data.payments?.map(p => (
              <tr key={p.payment_id}>
                <td className={styles.idCell} style={{ color:'var(--primary)' }}>PAY-{String(p.payment_id).padStart(3,'0')}</td>
                <td>ORD-{String(p.order_id).padStart(3,'0')}</td>
                <td><strong>{p.customer_name}</strong></td>
                <td style={{ fontWeight:700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                <td><span className="badge badge-blue">{p.method?.toUpperCase()}</span></td>
                <td className={styles.mutedCell}>{p.payment_date?.slice(0,10)}</td>
                <td><StatusBadge s={p.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* ─── ENQUIRIES ─── */}
        {tab === 'Enquiries' && (
          <DataTable loading={loading} heads={['ID','Name','Email','Phone','City','Service','Bill/mo','Date','Responded']}>
            {data.enquiries?.map(e => (
              <tr key={e.enquiry_id}>
                <td className={styles.idCell}>ENQ-{String(e.enquiry_id).padStart(3,'0')}</td>
                <td><strong>{e.name}</strong></td>
                <td className={styles.mutedCell}>{e.email}</td>
                <td>{e.phone}</td>
                <td>{e.city}</td>
                <td style={{ fontSize:'0.8rem' }}>{e.service_type}</td>
                <td style={{ color:'var(--primary)' }}>₹{Number(e.monthly_bill||0).toLocaleString('en-IN')}</td>
                <td className={styles.mutedCell}>{e.submitted_at?.slice(0,10)}</td>
                <td>
                  <StatusBadge s={e.is_responded ? 'completed' : 'pending'} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </main>

      {/* Add Modal */}
      {addModal && (
        <AddModal
          {...addModal}
          onClose={() => setAddModal(null)}
          onSave={rec => { addModal.onSave(rec); toast('Record added successfully!', '✅') }}
        />
      )}
    </div>
  )
}

function tabIcon(t) {
  const icons = { Dashboard:'📊', Customers:'👥', Suppliers:'🏭', Products:'📦', Orders:'🛒', Installations:'🔧', Payments:'💳', Enquiries:'📩' }
  return icons[t] || '📋'
}
