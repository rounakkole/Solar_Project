import { useEffect, useRef, useState } from 'react'
import styles from './StatsBar.module.css'

const STATS = [
  { target: 250, suffix: '+', label: 'Happy Customers' },
  { target: 1, prefix: '₹', suffix: 'Cr+', label: 'Bills Saved' },
  { target: 15, suffix: 'MW+', label: 'Capacity Installed' },
  { target: 12, suffix: 'K+', label: 'Tonnes CO₂ Avoided' },
  { target: 7, suffix: ' Yr', label: 'Panel Warranty' },
]

function Counter({ target, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const ran = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true
        let cur = 0
        const step = target / 55
        const t = setInterval(() => {
          cur += step
          if (cur >= target) { setVal(target); clearInterval(t) }
          else setVal(Math.floor(cur))
        }, 28)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{prefix}{val}{suffix}</span>
}

export default function StatsBar() {
  return (
    <section className={styles.bar}>
      <div className={`container ${styles.grid}`}>
        {STATS.map(s => (
          <div key={s.label} className={styles.card}>
            <div className={styles.num}>
              <Counter target={s.target} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <div className={styles.lbl}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
