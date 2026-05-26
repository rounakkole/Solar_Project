import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import styles from './Hero.module.css'

export default function Hero() {
  const [animationData, setAnimationData] = useState(null)

  // Fetch Lottie JSON
  /* useEffect(() => {
    fetch("https://lottie.host/bd53fa06-5805-45ce-b1c4-00932821b04d/uUOvrw5CFs.json")
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Lottie error:", err))
  }, []) */

  return (
    <section className={styles.hero} id="hero">

      {/* GLOW EFFECTS */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* CONTENT */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          Power Your Home<br />
          With <span className={styles.highlight}>Clean Solar</span><br />
          Energy
        </h1>

        <p className={styles.sub}>
          Professional solar panel installation for residential, commercial & industrial properties.
          Save up to 90% on electricity bills. Government subsidies available.
        </p>

        <div className={styles.btns}>
          <a href="#calculator" className="btn-primary">
            Calculate Savings
          </a>
          <a href="#contact" className="btn-outline">
            Free Site Survey
          </a>
        </div>

        <div className={styles.stats}>
          {[
            ['250+', 'Installations Done'],
            ['15MW+', 'Solar Generated'],
            ['98%', 'Satisfaction Rate'],
            ['₹1Cr+', 'Bills Saved'],
          ].map(([n, l]) => (
            <div key={l} className={styles.stat}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLbl}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LOTTIE */}
      {/* <div className={styles.lottie}>
        {animationData && (
          <Lottie animationData={animationData} loop />
        )}
      </div> */}


      <div className={styles.lottie}>
        <img src="/LOTTIE-animation.gif" alt="Animated illustration" />
      </div>

      {/* SCROLL */}
      <div className={styles.scrollHint}>
        <div className={styles.scrollDot} />
      </div>

    </section>
  )
}