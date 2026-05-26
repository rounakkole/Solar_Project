import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <div className={styles.logo}>ARDOUR GREEN ENERGY</div>
            <p className={styles.about}>
              Maharashtra's most trusted solar installer. Powering homes & businesses with clean energy since 2015.
            </p>
          </div>




          {[
            { 
              title: 'Services', 
              links: [
                { name: 'Residential Solar', path: '/#services' },
                { name: 'Commercial Solar', path: '/#services' },
                { name: 'Industrial Solar', path: '/#services' }
              ] 
            },
            { 
              title: 'Company',  
              links: [
                { name: 'Products', path: '/#products' },
                { name: 'Gallery', path: '/gallery' }
              ] 
            },
            { 
              title: 'Support',  
              links: [
                { name: 'Locations', path: '/#map-section' },
                { name: 'Contact', path: '/#contact' }
              ] 
            },
          ].map(col => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(link => (
                  <li key={link.name}>

                    {link.path.includes('#') ? (
                    <a href={link.path}>{link.name}</a>
                    ) : (
                    <Link to={link.path}>{link.name}</Link>
                    )}
                  </li>

))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p> <i class="bi bi-c-circle-fill"></i> 2025 ARDOUR GREEN ENERGY. All rights reserved.</p>
          <p className={styles.tagline}> <i class="bi bi-sun-fill"></i> Go Solar. Go Green. Save Big.</p>
        </div>
      </div>
    </footer>
  )
}
