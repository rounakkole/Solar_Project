import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './Hero.module.css'

export default function Hero() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.4,
        dx: (Math.random() - 0.5) * 0.4,
        dy: -Math.random() * 0.6 - 0.2,
        o: Math.random() * 0.5 + 0.1
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,158,11,${p.o})`
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width }
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <section className={styles.hero} id="hero">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.content}>
        <div className={`${styles.badge} fade-up`}>
          <span className={styles.dot} /> India's #1 Solar Installer — Since 2015
        </div>

        <h1 className={`${styles.title} fade-up delay-1`}>
          Power Your Home<br />
          With <span className={styles.highlight}>Clean Solar</span><br />
          Energy
        </h1>

        <p className={`${styles.sub} fade-up delay-2`}>
          Professional solar panel installation for residential, commercial &amp; industrial properties.
          Save up to 90% on electricity bills. Government subsidies available.
        </p>

        <div className={`${styles.btns} fade-up delay-3`}>
          <a href="#calculator" className="btn-primary">
            ⚡ Calculate Savings
          </a>
          <a href="#contact" className="btn-outline">
            📞 Free Site Survey
          </a>
        </div>

        <div className={`${styles.stats} fade-up`} style={{ animationDelay: '0.4s' }}>
          {[
            ['2500+', 'Installations Done'],
            ['15MW+', 'Solar Generated'],
            ['98%',   'Satisfaction Rate'],
            ['₹45Cr+','Bills Saved'],
          ].map(([n, l]) => (
            <div key={l} className={styles.stat}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLbl}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.scrollHint}>
        <div className={styles.scrollDot} />
      </div>
    </section>
  )
}
