import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const links = [
  { label: 'Services',   href: '/#services' },
  { label: 'Products',   href: '/#products' },
  { label: 'Calculator', href: '/#calculator' },
  { label: 'Locations',  href: '/#map-section' },
  { label: 'Contact',    href: '/#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (href) => {
    setOpen(false)
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>☀ SolarTech Pro</Link>

      <ul className={`${styles.links} ${open ? styles.open : ''}`}>
        {links.map(l => (
          <li key={l.label}>
            <a href={l.href} onClick={() => handleNav(l.href)}>{l.label}</a>
          </li>
        ))}
        <li>
          <Link to="/admin" onClick={() => setOpen(false)} className={isAdmin ? styles.activeLink : ''}>
            Admin
          </Link>
        </li>
      </ul>

      <Link to="/#contact" className={styles.cta} onClick={() => handleNav('/#contact')}>
        Get Free Quote
      </Link>

      <button className={styles.hamburger} onClick={() => setOpen(o => !o)} aria-label="menu">
        <span className={open ? styles.cross1 : ''} />
        <span className={open ? styles.crossHide : ''} />
        <span className={open ? styles.cross2 : ''} />
      </button>
    </nav>
  )
}
