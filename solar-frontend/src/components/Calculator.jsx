import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import InvoiceModal from './InvoiceModal'
import styles from './Calculator.module.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const STATES = [
  { label: 'Maharashtra (5.5)',  irr: 5.5 },
  { label: 'Rajasthan (5.8)',    irr: 5.8 },
  { label: 'Karnataka (5.2)',    irr: 5.2 },
  { label: 'Delhi (4.9)',        irr: 4.9 },
  { label: 'Gujarat (5.0)',      irr: 5.0 },
  { label: 'Tamil Nadu (5.6)',   irr: 5.6 },
  { label: 'West Bengal (4.7)', irr: 4.7 },
]

function fmt(n) { return Math.round(n).toLocaleString('en-IN') }

export default function Calculator() {
  const [bill, setBill]       = useState('')
  const [irr, setIrr]         = useState(5.5)
  const [propType, setPropType] = useState(1)
  const [result, setResult]   = useState(null)
  const [showInvoice, setShowInvoice] = useState(false)

  const calculate = () => {
    const b = parseFloat(bill) || 0
    if (b < 200) { setResult(null); return }
    const rate    = 8
    const units   = b / rate
    const sizeKw  = Math.ceil((units / (irr * 30)) * propType * 10) / 10
    const cost    = sizeKw * 65000 * propType
    const subsidy = Math.min(cost * 0.3, 94500)
    const net     = cost - subsidy
    const saving  = b * 0.85
    const payback = net / (saving * 12)
    const total25 = saving * 12 * 25 - net
    const years   = [0,1,2,3,5,7,10,15,20,25]
    setResult({ sizeKw, cost, subsidy, net, saving, payback, total25, years,
      cumSavings: years.map(y => Math.round(saving * 12 * y)),
      netProfit:  years.map(y => Math.round(saving * 12 * y - net)) })
  }

  const chartData = result ? {
    labels: result.years.map(y => `Yr ${y}`),
    datasets: [
      {
        label: 'Cumulative Savings',
        data: result.cumSavings,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#F59E0B', pointRadius: 4,
      },
      {
        label: 'Net Profit',
        data: result.netProfit,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.05)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#10B981', pointRadius: 4,
      }
    ]
  } : null

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: 'rgba(55,65,81,0.5)' } },
      y: {
        ticks: { color: '#9CA3AF', font: { size: 10 }, callback: v => '₹' + Math.round(v / 1000) + 'K' },
        grid: { color: 'rgba(55,65,81,0.5)' }
      }
    }
  }

  return (
    <section className="section" id="calculator">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="section-badge">Solar Calculator</span>
          <h2 className="section-title">Calculate Your Savings</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>
            Enter your monthly electricity bill and see exactly how much you save with solar.
          </p>
        </div>

        <div className={styles.wrap}>
          {/* ─── Input Panel ─── */}
          <div className={styles.inputPanel}>
            <h3>Your Details</h3>

            <div className={styles.field}>
              <label>Monthly Electricity Bill (₹)</label>
              <input
                type="number"
                placeholder="e.g. 3500"
                value={bill}
                onChange={e => { setBill(e.target.value); setTimeout(calculate, 0) }}
              />
            </div>

            <div className={styles.field}>
              <label>State</label>
              <select onChange={e => { setIrr(+e.target.value); setTimeout(calculate, 0) }}>
                {STATES.map(s => <option key={s.label} value={s.irr}>{s.label} kWh/m²/day</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label>Property Type</label>
              <select onChange={e => { setPropType(+e.target.value); setTimeout(calculate, 0) }}>
                <option value={1}>Residential</option>
                <option value={1.2}>Commercial</option>
                <option value={1.5}>Industrial</option>
              </select>
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={calculate}>
              Calculate
            </button>

            {result && (
              <div className={styles.results}>
                {[
                  ['System Size',             `${result.sizeKw.toFixed(1)} kW`],
                  ['System Cost',             `₹${fmt(result.cost)}`],
                  ['Govt. Subsidy (30%)',      `₹${fmt(result.subsidy)}`],
                  ['Net Cost After Subsidy',   `₹${fmt(result.net)}`],
                  ['Monthly Bill Saving',      `₹${fmt(result.saving)}/mo`],
                  ['Payback Period',           `${result.payback.toFixed(1)} years`],
                  ['25-Year Total Savings',    `₹${fmt(result.total25)}`],
                ].map(([k, v], i) => (
                  <div key={k} className={`${styles.row} ${i === 6 ? styles.rowTotal : ''}`}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                  onClick={() => setShowInvoice(true)}
                >
                  Generate Invoice
                </button>
              </div>
            )}
          </div>

          {/* ─── Chart Panel ─── */}
          <div className={styles.chartPanel}>
            <h3>25-Year Savings Projection</h3>
            {chartData
              ? <div style={{ height: 300 }}><Line data={chartData} options={chartOpts} /></div>
              : <div className={styles.chartEmpty}>Enter your bill amount to see the projection <i class="bi bi-arrow-right-square-fill"></i> </div>
            }
            {result && (
              <div className={styles.chartStats}>
                <div className={styles.cStat}>
                  <span>Break-even</span>
                  <strong style={{ color: 'var(--primary)' }}>{result.payback.toFixed(1)} yrs</strong>
                </div>
                <div className={styles.cStat}>
                  <span>25yr Savings</span>
                  <strong style={{ color: 'var(--accent)' }}>₹{fmt(result.total25)}</strong>
                </div>
                <div className={styles.cStat}>
                  <span>Monthly Save</span>
                  <strong style={{ color: '#60A5FA' }}>₹{fmt(result.saving)}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoice && result && (
        <InvoiceModal result={result} bill={bill} onClose={() => setShowInvoice(false)} />
      )}
    </section>
  )
}
