import { useState } from 'react'
import styles from './MapSection.module.css'

const LOCATIONS = [  
  { name: 'Pune Office',   city: 'Pune, MH',     cap: '1.8 MW', lat: 18.5204, lng: 73.8567, projects: 310 }, 
   
  ];

export default function MapSection() {
  const [active, setActive] = useState(0)
  const loc = LOCATIONS[active]

  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15000!2d${loc.lng}!3d${loc.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1000000000000`

  return (
    <section className="section" id="map-section" style={{ background: 'var(--bg2)' }}>
      <div className="container">
        <span className="section-badge">Installation Map</span>
        <h2 className="section-title">Our Projects Across India</h2>
        <p className="section-sub">
          Over 2,500 installations across Maharashtra. Click a location to explore projects.
        </p>

        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <p className={styles.sideTitle}>Featured Locations</p>
            {LOCATIONS.map((l, i) => (
              <button
                key={l.name}
                className={`${styles.locBtn} ${active === i ? styles.locActive : ''}`}
                onClick={() => setActive(i)}
              >
                <span className={styles.locIcon}> <i class="bi bi-pin-map-fill"></i> </span>
                <div>
                  <strong>{l.name}</strong>
                  <span>{l.city}</span>
                  <span className={styles.locMeta}>{l.cap} installed · {l.projects} projects</span>
                </div>
              </button>
            ))}
          </div>

          {/* Map */}
          <div className={styles.mapWrap}>
            {/* <div className={styles.mapBadge}>
              <i class="bi bi-pin-map-fill"></i> {loc.name} — {loc.cap}
            </div> */}
            <iframe
              key={active}
              src={mapSrc}
              title="Installation Map"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
